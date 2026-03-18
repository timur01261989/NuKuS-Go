
import { useEffect, useRef } from "react";
import { listParcels, logIntegrationError } from "../services/integrationApi";
import { logisticsLogger } from "@/modules/shared/domain/logistics/logisticsLogger.js";
import { buildRealtimeEventSignature, buildRealtimeMeta, shouldPauseRealtime } from "@/modules/shared/domain/logistics/realtimeTelemetry.js";

/**
 * Supabase Realtime + polling fallback
 * Source-of-truth: delivery_orders
 */
export function useParcelSocket({
  enabled,
  supabase,
  onSnapshot,
  onEvent,
  filter = {},
  pollIntervalMs = 20000,
}) {
  const pollRef = useRef(null);
  const channelRef = useRef(null);
  const lastSignatureRef = useRef("");
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    const emitMeta = (patch = {}) => {
      onEvent?.({
        type: "meta",
        meta: buildRealtimeMeta({
          source: supabase ? "realtime+polling" : "polling",
          state: enabled ? "live" : "idle",
          hidden: shouldPauseRealtime(),
          paused: pausedRef.current,
          ...patch,
        }),
      });
    };

    const refresh = async ({ silent = false } = {}) => {
      if (pausedRef.current && silent) return;
      try {
        const data = await listParcels(filter);
        if (alive) {
          onSnapshot?.(data);
          emitMeta({ lastRefreshAt: new Date().toISOString() });
        }
      } catch (e) {
        logIntegrationError("listParcels", e, { filter });
        logisticsLogger.error("delivery", "parcelSocketRefresh", {
          message: e?.message || "Delivery list error",
          filter,
        });
        onEvent?.({ type: "error", error: e?.message || "Delivery list error" });
      }
    };

    const onVisibilityChange = () => {
      pausedRef.current = shouldPauseRealtime();
      emitMeta({});
      if (!pausedRef.current) refresh({ silent: false });
    };

    if (typeof document !== "undefined") {
      pausedRef.current = shouldPauseRealtime();
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    refresh();
    pollRef.current = setInterval(() => refresh({ silent: true }), pollIntervalMs);

    if (supabase) {
      try {
        channelRef.current = supabase
          .channel("delivery_orders:realtime")
          .on("postgres_changes", { event: "*", schema: "public", table: "delivery_orders" }, (payload) => {
            const signature = buildRealtimeEventSignature(payload);
            const duplicate = signature && signature === lastSignatureRef.current;
            lastSignatureRef.current = signature || lastSignatureRef.current;
            onEvent?.({
              type: "realtime",
              payload,
              meta: buildRealtimeMeta({
                source: "realtime",
                state: "live",
                hidden: shouldPauseRealtime(),
                paused: pausedRef.current,
                duplicate,
                lastEventAt: new Date().toISOString(),
              }),
            });
            if (!duplicate) refresh({ silent: true });
          })
          .subscribe((status) => {
            emitMeta({ state: String(status || "").toLowerCase() || "subscribed" });
          });
      } catch (e) {
        logIntegrationError("subscribeDeliveryOrders", e);
        logisticsLogger.error("delivery", "parcelSocketSubscribe", { message: e?.message || "Realtime subscribe error" });
        onEvent?.({ type: "error", error: e?.message || "Realtime subscribe error" });
      }
    }

    return () => {
      alive = false;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (supabase && channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch {}
      }
      channelRef.current = null;
    };
  }, [enabled, supabase, pollIntervalMs, JSON.stringify(filter), onSnapshot, onEvent]);
}
