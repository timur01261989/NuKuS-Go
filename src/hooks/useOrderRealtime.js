import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * useOrderRealtime(orderId)
 * - Debug-friendly hook used in Dev tools.
 * - Subscribes to 'orders' table changes (if present) and keeps last row in state.
 */
export function useOrderRealtime(orderId) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setError(null);
      return;
    }

    let channel;

    (async () => {
      try {
        // Initial fetch (safe if table exists)
        const { data, error: e } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();

        if (e) throw e;
        if (data) setOrder(data);

        channel = supabase
          .channel(`orders:${orderId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
            (payload) => {
              const row = payload?.new || payload?.old || null;
              if (row) setOrder(row);
            }
          )
          .subscribe((status) => {
            // status: SUBSCRIBED / TIMED_OUT / CHANNEL_ERROR / CLOSED
          });
      } catch (err) {
        // Don't crash the app if table doesn't exist; keep it visible for dev pages.
        setError(err);
      }
    })();

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (_) {}
    };
  }, [orderId]);

  return { order, error };
}
