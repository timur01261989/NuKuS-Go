import { useEffect, useRef } from "react";
import { useTaxi } from "../context/TaxiProvider";
import { TaxiOrderStatus } from "../context/taxiReducer";
import { cityTaxiApi } from "../services/cityTaxiApi";
import { speakAlisa } from "../utils/voice";
import { supabase } from "@/lib/supabase";

/**
 * useTaxiSocket.js
 * Asosiy vazifa: Online bo'lsa buyurtmalarni kuzatish.
 *
 * STRATEGIYA (ikki qatlam):
 * 1. Supabase Realtime (postgres_changes) — order_offers jadvalidagi yangi offerlarni
 *    real vaqtda qabul qiladi. Bu asosiy mexanizm.
 * 2. Polling fallback (har 8 soniyada) — Realtime ulanish muammosi bo'lsa,
 *    yoki haydovchi birinchi marta onlayn bo'lganda mavjud offerlarni tekshiradi.
 *
 * Bu yondashuv:
 *  - 100+ haydovchida server yukini kamaytiradi (polling o'rniga realtime)
 *  - Realtime ishlamasa ham ishlaydi (polling fallback)
 */
export function useTaxiSocket({ enabled }) {
  const { state, dispatch } = useTaxi();
  const seenRef = useRef(new Set());
  const realtimeChannelRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const driverUserIdRef = useRef(null);

  // Driver user ID ni olish (bir marta)
  useEffect(() => {
    if (!enabled) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        driverUserIdRef.current = data.user.id;
      }
    });
  }, [enabled]);

  // Polling: mavjud buyurtmalarni tekshirish (fallback + birinchi tekshiruv)
  const pollOrders = async (alive) => {
    if (!alive) return;
    try {
      dispatch({ type: "orders/fetchStart" });
      const list = await cityTaxiApi.listAvailable();
      if (!alive) return;
      dispatch({ type: "orders/fetchSuccess", payload: list });

      // Yangi buyurtma aniqlash
      const newest = (list || []).find(
        (o) => o.status === TaxiOrderStatus.NEW || o.status === "searching" || o.status === "NEW"
      );
      if (newest && !seenRef.current.has(String(newest.id)) && !state.activeOrder && !state.incomingOrder) {
        seenRef.current.add(String(newest.id));
        const normalized = normalizeIncoming(newest);
        dispatch({ type: "orders/setIncoming", payload: normalized });
        speakAlisa("Yangi buyurtma keldi.");
      }
    } catch (e) {
      dispatch({ type: "orders/fetchError", payload: e?.message || "Polling xatosi" });
    }
  };

  useEffect(() => {
    if (!enabled) return;

    let alive = true;

    // 1. Birinchi polling — darhol
    pollOrders(alive);

    // 2. Supabase Realtime: order_offers jadvalidagi yangi offerlarni kuzatish
    const setupRealtime = () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }

      const channel = supabase
        .channel("driver-offers-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "order_offers",
            // driver_id bilan filter — faqat shu haydovchiga kelgan offerlar
          },
          async (payload) => {
            if (!alive) return;
            const row = payload?.new;
            if (!row) return;

            // Faqat shu haydovchiga kelgan offerlar
            const myId = driverUserIdRef.current;
            if (myId && row.driver_id !== myId && row.driver_user_id !== myId) return;
            if (row.status !== "sent") return;

            // Offer muddati o'tmagan bo'lsa
            if (row.expires_at && new Date(row.expires_at) < new Date()) return;

            // Allaqachon ko'rilgan offer
            if (seenRef.current.has(String(row.order_id))) return;
            if (state.activeOrder || state.incomingOrder) return;

            seenRef.current.add(String(row.order_id));

            // Buyurtma tafsilotlarini olish
            try {
              const list = await cityTaxiApi.listAvailable();
              if (!alive) return;
              dispatch({ type: "orders/fetchSuccess", payload: list });

              const incoming = (list || []).find(o => String(o.id) === String(row.order_id));
              if (incoming) {
                dispatch({ type: "orders/setIncoming", payload: normalizeIncoming(incoming) });
                speakAlisa("Yangi buyurtma keldi.");
              }
            } catch {
              // fallback: polling ishlab ketadi
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "order_offers",
          },
          (payload) => {
            if (!alive) return;
            const row = payload?.new;
            if (!row) return;
            const myId = driverUserIdRef.current;
            if (myId && row.driver_id !== myId && row.driver_user_id !== myId) return;

            // Offer bekor qilindi yoki muddati o'tdi — incoming ni tozalash
            if (row.status === "expired" || row.status === "rejected") {
              dispatch({ type: "orders/setIncoming", payload: null });
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Realtime ulandi — polling oraliqni kamaytirish mumkin
          }
        });

      realtimeChannelRef.current = channel;
    };

    setupRealtime();

    // 3. Polling fallback — har 8 soniyada (realtime yordamchi sifatida)
    // Realtime ishlamasa ham ishlaydi. Oraliq 4.5s dan 8s ga oshirildi —
    // server yukini kamaytiradi
    pollingTimerRef.current = setInterval(() => {
      pollOrders(alive);
    }, 8000);

    return () => {
      alive = false;
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [enabled, dispatch]);

  // Active order status o'zgarsa ovoz
  useEffect(() => {
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
