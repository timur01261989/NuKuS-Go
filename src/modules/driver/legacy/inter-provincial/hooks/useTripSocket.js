import { useEffect, useRef } from "react";
import { interProvincialApi } from "../services/interProvincialApi";
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Realtime: inter_prov_seat_requests INSERT eventlarni tinglaydi.
 * Agar realtime client ishlamasa: polling fallback.
 */
export function useTripSocket({ tripId, dispatch }) {
  const pollRef = useRef(null);

  useEffect(() => {
    if (!tripId) return undefined;

    let mounted = true;

    const setRequests = async () => {
      const list = await interProvincialApi.listSeatRequests(tripId);
      if (mounted) dispatch({ type: "SET_SEAT_REQUESTS", requests: list });
    };

    void setRequests();

    if (supabase?.channel) {
      const channel = supabase
        .channel(`interprov_seat_requests:${tripId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "inter_prov_seat_requests", filter: `trip_id=eq.${tripId}` },
          (payload) => {
            dispatch({ type: "ADD_SEAT_REQUEST", request: payload.new });
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "inter_prov_seat_requests", filter: `trip_id=eq.${tripId}` },
          () => {
            void setRequests();
          }
        )
        .subscribe();

      return () => {
        mounted = false;
        supabase.removeChannel(channel);
      };
    }

    pollRef.current = setInterval(() => {
      void setRequests();
    }, 8000);

    return () => {
      mounted = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [tripId, dispatch]);
}
