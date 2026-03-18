
import { useEffect, useRef } from "react";
import { listVehicleCargo } from "../services/freightApi";
import { logisticsLogger } from "@/modules/shared/domain/logistics/logisticsLogger.js";
import { buildRealtimeEventSignature, shouldPauseRealtime } from "@/modules/shared/domain/logistics/realtimeTelemetry.js";

/**
 * useFreightSocket
 * Unified freight_orders source with realtime + polling fallback.
 */
export function useFreightSocket({ enabled, dispatch, vehicle, mode }) {
  const pollRef = useRef(null);
  const lastSignatureRef = useRef("");
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let unsub = null;
    let supabase = null;

    const tryLoadSupabase = async () => {
      try {
        const m = await import("@/services/supabase/supabaseClient");
        supabase = m?.supabase;
      } catch (error) {
        logisticsLogger.warn("freight", "loadSupabase", { message: error?.message || "import failed" });
        supabase = null;
      }
    };

    const refresh = async ({ silent = false } = {}) => {
      if (pausedRef.current && silent) return;
      dispatch({ type: "ORDERS_LOADING" });
      try {
        const res = await listVehicleCargo({
          vehicle_kind: vehicle?.kind || null,
          mode: mode || null,
        });
        const orders = res?.data?.orders || res?.orders || res?.data || [];
        dispatch({ type: "ORDERS_SUCCESS", orders });
      } catch (error) {
        logisticsLogger.error("freight", "listVehicleCargo", {
          message: error?.message || "Server xatosi",
          vehicleKind: vehicle?.kind || null,
          mode: mode || null,
        });
        dispatch({ type: "ORDERS_ERROR", error: error?.message || "Server xatosi" });
      }
    };


const onVisibilityChange = () => {
  pausedRef.current = shouldPauseRealtime();
  if (!pausedRef.current) refresh({ silent: false });
};

if (typeof document !== "undefined") {
  pausedRef.current = shouldPauseRealtime();
  document.addEventListener("visibilitychange", onVisibilityChange);
}

    (async () => {
      await tryLoadSupabase();
      await refresh({ silent: false });

      if (supabase?.channel) {
        const ch = supabase
          .channel("freight_orders_stream")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "cargo_orders" },
            (payload) => {
              const signature = buildRealtimeEventSignature(payload);
              const duplicate = signature && signature === lastSignatureRef.current;
              lastSignatureRef.current = signature || lastSignatureRef.current;
              if (!duplicate) refresh({ silent: true });
            }
          )
          .subscribe();

        unsub = () => supabase.removeChannel(ch);
      } else {
        pollRef.current = setInterval(() => refresh({ silent: true }), 8000);
      }
    })();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
      if (unsub) unsub();
    };
  }, [enabled, dispatch, vehicle?.kind, mode]);
}
