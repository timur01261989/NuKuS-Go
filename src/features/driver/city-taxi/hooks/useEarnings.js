/**
 * useEarnings.js
 * Haydovchining bugungi va haftalik daromadini Supabase'dan oladi.
 *
 * Qanday ishlaydi:
 *  - Supabase'dan "completed" statusdagi buyurtmalar summasini hisoblaydi
 *  - Har 60 soniyada avtomatik yangilanadi
 *  - Xato bo'lsa ordersFeed.items dan fallback hisoblash
 */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTaxi } from "../context/TaxiProvider";
import { TaxiOrderStatus } from "../context/taxiReducer";

export function useEarnings() {
  const { state } = useTaxi();
  const [earnings, setEarnings] = useState({ todayUzs: 0, weekUzs: 0, tripsToday: 0 });
  const intervalRef = useRef(null);

  const fetchEarnings = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      // Bugungi yakunlangan safarlar
      const { data: todayData, error: todayErr } = await supabase
        .from("orders")
        .select("id, price, amount, priceUzs")
        .eq("driver_user_id", userId)
        .eq("status", "completed")
        .gte("created_at", todayStart.toISOString());

      if (todayErr) throw todayErr;

      // Haftalik yakunlangan safarlar
      const { data: weekData, error: weekErr } = await supabase
        .from("orders")
        .select("id, price, amount, priceUzs")
        .eq("driver_user_id", userId)
        .eq("status", "completed")
        .gte("created_at", weekStart.toISOString());

      if (weekErr) throw weekErr;

      const sumUzs = (rows) =>
        (rows || []).reduce((s, o) => s + Number(o.priceUzs || o.price || o.amount || 0), 0);

      setEarnings({
        todayUzs: sumUzs(todayData),
        weekUzs: sumUzs(weekData),
        tripsToday: (todayData || []).length,
      });
    } catch {
      // Fallback: ordersFeed.items dan hisoblash (network yo'q bo'lganda)
      const items = state.ordersFeed.items || [];
      const completed = items.filter(
        (o) => (o.status || "").toUpperCase() === TaxiOrderStatus.COMPLETED
      );
      const todayUzs = completed.reduce((s, o) => s + Number(o.priceUzs || o.price || 0), 0);
      setEarnings({ todayUzs, weekUzs: todayUzs, tripsToday: completed.length });
    }
  };

  useEffect(() => {
    fetchEarnings();
    intervalRef.current = setInterval(fetchEarnings, 60000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { earnings };
}
