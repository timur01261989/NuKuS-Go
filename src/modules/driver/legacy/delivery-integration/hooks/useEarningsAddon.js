import { useMemo } from "react";

export function useEarningsAddon({ baseEarnings = 0, parcels = [], field = "price" }) {
  return useMemo(() => {
    const list = Array.isArray(parcels) ? parcels : [];
    const parcelSum = list.reduce((acc, p) => {
      const status = String(p?.status || "");
      if (!["accepted", "pickup", "delivering", "completed"].includes(status)) return acc;
      const v = Number(p?.[field] || p?.amount || 0);
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
    const total = Number(baseEarnings || 0) + parcelSum;
    return { total, parcelSum, baseEarnings: Number(baseEarnings || 0) };
  }, [baseEarnings, field, JSON.stringify(parcels || [])]);
}
