import { useMemo } from "react";
import { useTaxi } from "../context/TaxiProvider";
import { TaxiOrderStatus } from "../context/taxiReducer";

/**
 * useEarnings.js
 * - oddiy hisob: COMPLETED bo'lgan safarlar summasi
 * - keyin backend bilan real qilib beriladi
 */
export function useEarnings() {
  const { state } = useTaxi();

  const earnings = useMemo(() => {
    const items = state.ordersFeed.items || [];
    const completed = items.filter((o) => (o.status || "").toUpperCase() === TaxiOrderStatus.COMPLETED);
    const todayUzs = completed.reduce((s, o) => s + Number(o.priceUzs || o.price || 0), 0);
    return {
      todayUzs,
      weekUzs: todayUzs,
      tripsToday: completed.length,
    };
  }, [state.ordersFeed.items]);

  return { earnings };
}
