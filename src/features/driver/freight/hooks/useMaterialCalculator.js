import { useMemo } from "react";

/**
 * Bulk materials uchun hisob:
 * - unit='trip': perTrip * amount
 * - unit='ton': perTon * amount
 */
export function useMaterialCalculator({ unit, amount }, { perTrip, perTon }) {
  return useMemo(() => {
    const a = Math.max(0, Number(amount || 0));
    if (unit === "ton") return Math.round((Number(perTon || 0) * a) || 0);
    return Math.round((Number(perTrip || 0) * a) || 0);
  }, [unit, amount, perTrip, perTon]);
}
