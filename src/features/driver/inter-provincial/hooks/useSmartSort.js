import { useCallback } from "react";
import { osrmRoute } from "../services/osrm";
import { haversineKm } from "../utils/geo";

/**
 * Yo'lovchi/posilka manzillarini "eng yaqinidan uzo'giga" saralash.
 * OSRM ishlasa: vaqt/distance bo'yicha aniqroq. Bo'lmasa: haversine fallback.
 */
export function useSmartSort() {
  return useCallback(async (origin, points) => {
    if (!origin || !Array.isArray(points)) return points || [];

    const out = [];
    let cur = origin;
    const left = [...points];

    while (left.length) {
      let bestIdx = 0;
      let bestScore = Infinity;

      // greedily pick nearest next point
      for (let i = 0; i < left.length; i++) {
        const p = left[i]?.latlng;
        if (!p) continue;

        try {
          const r = await osrmRoute(cur, p);
          const score = r?.durationMin ?? (r?.distanceKm ?? haversineKm(cur, p));
          if (score < bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        } catch {
          const score = haversineKm(cur, p);
          if (score < bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }
      }

      const chosen = left.splice(bestIdx, 1)[0];
      out.push(chosen);
      cur = chosen?.latlng || cur;
    }

    return out;
  }, []);
}
