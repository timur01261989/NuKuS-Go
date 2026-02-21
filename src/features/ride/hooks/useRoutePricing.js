import { useCallback, useMemo, useState } from "react";

export default function useRoutePricing() {
  const [distanceMeters, setDistanceMeters] = useState(0);

  const distanceKm = useMemo(() => (distanceMeters / 1000).toFixed(1), [distanceMeters]);

  const price = useMemo(() => {
    const km = distanceMeters / 1000;
    return Math.max(9000, Math.round(km * 2500));
  }, [distanceMeters]);

  const setDistanceMetersSafe = useCallback((m) => {
    setDistanceMeters(Number(m) || 0);
  }, []);

  return { distanceKm, price, setDistanceMeters: setDistanceMetersSafe };
}
