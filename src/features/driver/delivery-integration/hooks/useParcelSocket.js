import { useEffect, useRef } from "react";
import { listParcels } from "../services/integrationApi";

/**
 * Supabase Realtime + polling fallback
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

  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    const refresh = async () => {
      try {
        const data = await listParcels(filter);
        if (alive) onSnapshot?.(data);
      } catch (e) {
        onEvent?.({ type: "error", error: e?.message || "Parcel list error" });
      }
    };

    refresh();
    pollRef.current = setInterval(refresh, pollIntervalMs);

    if (supabase) {
      try {
        channelRef.current = supabase
          .channel("parcels:realtime")
          .on("postgres_changes", { event: "*", schema: "public", table: "parcels" }, (payload) => {
            onEvent?.({ type: "realtime", payload });
            refresh();
          })
          .subscribe();
      } catch (e) {
        onEvent?.({ type: "error", error: e?.message || "Realtime subscribe error" });
      }
    }

    return () => {
      alive = false;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (supabase && channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch {}
      }
      channelRef.current = null;
    };
  }, [enabled, supabase, pollIntervalMs, JSON.stringify(filter)]);
}
