import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * useDriverLocationRealtime(orderId)
 * - Debug-friendly hook.
 * - Tries to subscribe to 'driver_locations' by order_id if present.
 */
export function useDriverLocationRealtime(orderId) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setLocation(null);
      setError(null);
      return;
    }

    let channel;

    (async () => {
      try {
        const { data, error: e } = await supabase
          .from("driver_locations")
          .select("*")
          .eq("order_id", orderId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (e) throw e;
        if (data) setLocation(data);

        channel = supabase
          .channel(`driver_locations:${orderId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "driver_locations",
              filter: `order_id=eq.${orderId}`,
            },
            (payload) => {
              const row = payload?.new || payload?.old || null;
              if (row) setLocation(row);
            }
          )
          .subscribe();
      } catch (err) {
        setError(err);
      }
    })();

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (_) {}
    };
  }, [orderId]);

  return { location, error };
}
