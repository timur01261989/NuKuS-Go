import { useEffect, useMemo, useState } from "react";
import { findDistrictByName, haversineKm, estimateDistrictPrice } from "../services/districtData";

/**
 * useDistrictRoute.js
 * -------------------------------------------------------
 * Tanlangan from/to tumanlar asosida:
 * - distanceKm
 * - durationMin (taxminiy)
 * - price (km asosida)
 * hisoblab beradi.
 */
export function useDistrictRoute(fromDistrictName, toDistrictName) {
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);
  const [price, setPrice] = useState(null);

  const from = useMemo(() => findDistrictByName(fromDistrictName), [fromDistrictName]);
  const to = useMemo(() => findDistrictByName(toDistrictName), [toDistrictName]);

  useEffect(() => {
    if (!from || !to) {
      setDistanceKm(null);
      setDurationMin(null);
      setPrice(null);
      return;
    }
    const d = haversineKm(from, to);
    setDistanceKm(d);

    // 50km/h taxminiy
    const minutes = (d / 50) * 60;
    setDurationMin(minutes);

    setPrice(estimateDistrictPrice(d));
  }, [from, to]);

  return { from, to, distanceKm, durationMin, price };
}
