import { useEffect, useRef } from "react";
import { message } from "antd";
import { useTaxi } from "../context/TaxiProvider";
import { TaxiOrderStatus } from "../context/taxiReducer";
import { cityTaxiApi } from "../services/cityTaxiApi";
import { speakAlisa } from "../utils/voice";

/**
 * useTaxiSocket.js
 * Asosiy vazifa: Online bo‘lsa buyurtmalarni kuzatish.
 * - Supabase realtime bo‘lmasa ham ishlashi uchun: POLLING fallback.
 */
export function useTaxiSocket({ enabled }) {
  const { state, dispatch } = useTaxi();
  const seenRef = useRef(new Set());

  useEffect(() => {
    if (!enabled) return;

    let alive = true;
    let timer = null;

    const tick = async () => {
      try {
        dispatch({ type: "orders/fetchStart" });
        const list = await cityTaxiApi.listAvailable();
        if (!alive) return;
        dispatch({ type: "orders/fetchSuccess", payload: list });

        // NEW order detection
        const newest = (list || []).find((o) => o.status === TaxiOrderStatus.NEW || o.status === "searching" || o.status === "NEW");
        if (newest && !seenRef.current.has(String(newest.id)) && !state.activeOrder && !state.incomingOrder) {
          seenRef.current.add(String(newest.id));
          const normalized = normalizeIncoming(newest);
          dispatch({ type: "orders/setIncoming", payload: normalized });
          speakAlisa("Yangi buyurtma keldi.");
        }
      } catch (e) {
        dispatch({ type: "orders/fetchError", payload: e?.message || "Socket/Polling error" });
      }
    };

    tick();
    timer = setInterval(tick, 4500);

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [enabled, dispatch, state.activeOrder, state.incomingOrder]);

  useEffect(() => {
    // order status o‘zgarsa ham ovoz
    const s = state.activeOrder?.status;
    if (!s) return;
    if (s === TaxiOrderStatus.ACCEPTED) speakAlisa("Buyurtma qabul qilindi.");
    if (s === TaxiOrderStatus.ARRIVED) speakAlisa("Mijoz yonidasiz.");
    if (s === TaxiOrderStatus.ON_TRIP) speakAlisa("Safar boshlandi.");
    if (s === TaxiOrderStatus.COMPLETED) speakAlisa("Safar yakunlandi.");
  }, [state.activeOrder?.status]);
}

function normalizeIncoming(o) {
  return {
    id: o.id,
    status: TaxiOrderStatus.NEW,
    priceUzs: o.priceUzs || o.price || o.amount || 0,
    pickup_lat: o.pickup_lat ?? o.from_lat ?? o.fromLat ?? o.pickup?.lat,
    pickup_lng: o.pickup_lng ?? o.from_lng ?? o.fromLng ?? o.pickup?.lng,
    dropoff_lat: o.dropoff_lat ?? o.to_lat ?? o.toLat ?? o.dropoff?.lat,
    dropoff_lng: o.dropoff_lng ?? o.to_lng ?? o.toLng ?? o.dropoff?.lng,
    pickup_address: o.pickup_address ?? o.pickup_location ?? o.pickupAddress ?? o.from_address ?? o.fromAddress ?? "",
    dropoff_address: o.dropoff_address ?? o.dropoff_location ?? o.dropoffAddress ?? o.to_address ?? o.toAddress ?? "",
    customer_name: o.customer_name ?? o.client_name ?? "Mijoz",
    customer_phone: o.customer_phone ?? o.phone ?? "",
  };
}
