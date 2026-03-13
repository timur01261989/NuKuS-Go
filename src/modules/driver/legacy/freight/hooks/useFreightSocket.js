import { useEffect, useRef } from "react";
import { listFreightOrders } from "../services/freightApi";

/**
 * useFreightSocket
 * - Agar supabase mavjud bo'lsa real-time ulanish qiladi.
 * - Bo'lmasa: polling fallback (8s).
 *
 * Supabase ixtiyoriy: src/lib/supabase.js export { supabase }
 */
export function useFreightSocket({ enabled, dispatch, vehicle, mode }) {
  const pollRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    let unsub = null;
    let supabase = null;

    const tryLoadSupabase = async () => {
      try {
        const m = await import("@/services/supabase/supabaseClient");
        supabase = m?.supabase;
      } catch {
        supabase = null;
      }
    };

    const refresh = async () => {
      dispatch({ type: "ORDERS_LOADING" });
      try {
        const res = await listFreightOrders({
          vehicle_kind: vehicle?.kind || null,
          mode: mode || null,
        });
        const orders = res?.data?.orders || res?.orders || res?.data || [];
        dispatch({ type: "ORDERS_SUCCESS", orders });
      } catch (e) {
        dispatch({ type: "ORDERS_ERROR", error: e?.message || "Server xatosi" });
      }
    };

    (async () => {
      await tryLoadSupabase();
      await refresh();

      // realtime if available
      if (supabase?.channel) {
        const ch = supabase
          .channel("freight_orders_stream")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "freight_orders" },
            () => {
              refresh();
            }
          )
          .subscribe();

        unsub = () => supabase.removeChannel(ch);
      } else {
        // polling
        pollRef.current = setInterval(refresh, 8000);
      }
    })();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (unsub) unsub();
    };
  }, [enabled, dispatch, vehicle?.kind, mode]);
}
