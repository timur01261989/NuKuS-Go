/**
 * useEarnings.js
 * Haydovchining bugungi va haftalik daromadini Supabase'dan oladi.
 */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/services/supabase/supabaseClient";
import { useTaxi } from "../context/TaxiProvider";
import { TAXI_STATUS, normalizeTaxiStatus } from "@/modules/shared/taxi/constants/taxiStatuses.js";
import { taxiLogger } from "@/modules/shared/taxi/utils/taxiLogger.js";

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

      const { data: todayData, error: todayErr } = await supabase
        .from("orders")
        .select("id, price, amount, priceUzs")
        .eq("driver_id", userId)
        .eq("status", TAXI_STATUS.COMPLETED)
        .gte("created_at", todayStart.toISOString());

      if (todayErr) throw todayErr;

      const { data: weekData, error: weekErr } = await supabase
        .from("orders")
        .select("id, price, amount, priceUzs")
        .eq("driver_id", userId)
        .eq("status", TAXI_STATUS.COMPLETED)
        .gte("created_at", weekStart.toISOString());

      if (weekErr) throw weekErr;

      const sumUzs = (rows) =>
        (rows || []).reduce((s, o) => s + Number(o.priceUzs || o.price || o.amount || 0), 0);

      setEarnings({
        todayUzs: sumUzs(todayData),
        weekUzs: sumUzs(weekData),
        tripsToday: (todayData || []).length,
      });
    } catch (error) {
      taxiLogger.warn("useEarnings fallback engaged", {
        error: error?.message || String(error),
      });
      const items = state.ordersFeed.items || [];
      const completed = items.filter((o) => normalizeTaxiStatus(o.status) === TAXI_STATUS.COMPLETED);
      const todayUzs = completed.reduce((s, o) => s + Number(o.priceUzs || o.price || 0), 0);
      setEarnings({ todayUzs, weekUzs: todayUzs, tripsToday: completed.length });
    }
  };

  useEffect(() => {
    fetchEarnings();
    intervalRef.current = setInterval(fetchEarnings, 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return { earnings };
}
