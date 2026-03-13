import { useEffect, useRef } from "react";
import { interProvincialApi } from "../services/interProvincialApi";

let supabase = null;
try {
  // eslint-disable-next-line import/no-unresolved
  supabase = require("@/services/supabase/supabaseClient").supabase;
} catch (e) {
  supabase = null;
}

/**
 * Realtime: inter_prov_seat_requests INSERT eventlarni tinglaydi.
 * Agar supabase yo'q bo'lsa: polling fallback.
 */
export function useTripSocket({ tripId, dispatch }) {
  const pollRef = useRef(null);

  useEffect(() => {
    if (!tripId) return;

    let mounted = true;

    const setRequests = async () => {
      const list = await interProvincialApi.listSeatRequests(tripId);
      if (mounted) dispatch({ type: "SET_SEAT_REQUESTS", requests: list });
    };

    // 1) initial load
    setRequests();

    // 2) realtime
    if (supabase) {
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
            // yangilangan bo'lsa listni sync qilib olamiz
            setRequests();
          }
        )
        .subscribe();

      return () => {
        mounted = false;
        supabase.removeChannel(channel);
      };
    }

    // 3) polling fallback
    pollRef.current = setInterval(setRequests, 8000);

    return () => {
      mounted = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [tripId, dispatch]);
}
