import { useEffect, useRef } from "react";
import { useTaxi } from "../context/TaxiProvider";
import { TaxiOrderStatus } from "../context/taxiReducer";
import { cityTaxiApi } from "../services/cityTaxiApi";
import { speakAlisa } from "../utils/voice";
import { supabase } from "@/services/supabase/supabaseClient";
import { mapDriverTaxiStatus } from "@/modules/shared/taxi/mappers/mapDriverTaxiStatus.js";
import { taxiLogger } from "@/modules/shared/taxi/utils/taxiLogger.js";

/**
 * Online bo'lsa buyurtmalarni kuzatadi:
 * 1) Realtime insert/update
 * 2) Polling fallback
 */
export function useTaxiSocket({ enabled }) {
  const { state, dispatch } = useTaxi();
  const seenRef = useRef(new Set());
  const realtimeChannelRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const driverUserIdRef = useRef(null);
  /** activeOrder / incomingOrder o'zgarganda realtime/polling qayta yaratilmasin */
  const activeOrderRef = useRef(null);
  const incomingOrderRef = useRef(null);

  useEffect(() => {
    activeOrderRef.current = state.activeOrder;
    incomingOrderRef.current = state.incomingOrder;
  }, [state.activeOrder, state.incomingOrder]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    supabase.auth.getUser()
      .then(({ data }) => {
        if (alive && data?.user?.id) {
          driverUserIdRef.current = data.user.id;
        }
      })
      .catch((error) => {
        taxiLogger.warn("Driver auth user olinmadi", { error: error?.message || String(error) });
      });
    return () => {
      alive = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    const pollOrders = async () => {
      if (!alive) return;
      try {
        dispatch({ type: "orders/fetchStart" });
        const list = await cityTaxiApi.listAvailable();
        if (!alive) return;
        dispatch({ type: "orders/fetchSuccess", payload: list });

        const newest = (list || []).find((o) => {
          const status = mapDriverTaxiStatus(o.status);
          return status === TaxiOrderStatus.NEW || status === TaxiOrderStatus.SEARCHING;
        });

        if (
          newest &&
          !seenRef.current.has(String(newest.id)) &&
          !activeOrderRef.current &&
          !incomingOrderRef.current
        ) {
          seenRef.current.add(String(newest.id));
          const normalized = normalizeIncoming(newest);
          dispatch({ type: "orders/setIncoming", payload: normalized });
          speakAlisa("Yangi buyurtma keldi.");
        }
      } catch (error) {
        taxiLogger.warn("Taxi polling xatosi", { error: error?.message || String(error) });
        dispatch({ type: "orders/fetchError", payload: error?.message || "Polling xatosi" });
      }
    };

    pollOrders();

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    const channel = supabase
      .channel("driver-offers-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_offers" },
        async (payload) => {
          if (!alive) return;
          const row = payload?.new;
          if (!row) return;

          const myId = driverUserIdRef.current;
          if (myId && row.driver_id !== myId) return;
          if (row.status !== "sent") return;
          if (row.expires_at && new Date(row.expires_at) < new Date()) return;
          if (seenRef.current.has(String(row.order_id))) return;
          if (activeOrderRef.current || incomingOrderRef.current) return;

          seenRef.current.add(String(row.order_id));

          try {
            const list = await cityTaxiApi.listAvailable();
            if (!alive) return;
            dispatch({ type: "orders/fetchSuccess", payload: list });

            const incoming = (list || []).find((o) => String(o.id) === String(row.order_id));
            if (incoming) {
              dispatch({ type: "orders/setIncoming", payload: normalizeIncoming(incoming) });
              speakAlisa("Yangi buyurtma keldi.");
            }
          } catch (error) {
            taxiLogger.warn("Realtime incoming offerni yuklashda xatolik", {
              error: error?.message || String(error),
              orderId: row.order_id,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "order_offers" },
        (payload) => {
          if (!alive) return;
          const row = payload?.new;
          if (!row) return;

          const myId = driverUserIdRef.current;
          if (myId && row.driver_id !== myId) return;

          if (row.status === "expired" || row.status === "rejected") {
            dispatch({ type: "orders/setIncoming", payload: null });
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          taxiLogger.warn("Taxi realtime kanalida xatolik", { status });
        }
      });

    realtimeChannelRef.current = channel;
    pollingTimerRef.current = setInterval(pollOrders, 8000);

    return () => {
      alive = false;
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [enabled, dispatch]);
}

function normalizeIncoming(raw) {
  return {
    id: raw?.id,
    status: mapDriverTaxiStatus(raw?.status, TaxiOrderStatus.NEW),
    priceUzs: Number(raw?.priceUzs || raw?.price || raw?.amount || 0),
    pickup_lat: raw?.pickup_lat ?? raw?.from_lat,
    pickup_lng: raw?.pickup_lng ?? raw?.from_lng,
    dropoff_lat: raw?.dropoff_lat ?? raw?.to_lat,
    dropoff_lng: raw?.dropoff_lng ?? raw?.to_lng,
    pickup_address: raw?.pickup_address ?? raw?.pickup_location ?? "",
    dropoff_address: raw?.dropoff_address ?? raw?.dropoff_location ?? "",
    customer_name: raw?.customer_name ?? raw?.passenger_name ?? "Mijoz",
    customer_phone: raw?.customer_phone ?? raw?.phone ?? "",
  };
}
