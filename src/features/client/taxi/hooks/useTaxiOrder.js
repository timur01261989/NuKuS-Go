import { useMemo, useState } from "react";

export default function useTaxiOrder() {
  const [route] = useState(null);
  const [tariff] = useState({ base: 5000, perKm: 1200, mult: 1 });
  const [step] = useState("main");

  // FIX: distance must be calculated BEFORE totalPrice
  const distanceKm = useMemo(() => {
    return route?.distanceKm || 0;
  }, [route]);

  const durationMin = useMemo(() => {
    return distanceKm ? distanceKm * 2 : 0;
  }, [distanceKm]);

  const totalPrice = useMemo(() => {
    const d = distanceKm || 0;
    const p = (tariff.base + d * tariff.perKm) * (tariff.mult || 1);
    return Math.round(p);
  }, [distanceKm, tariff]);

  return {
    step,
    distanceKm,
    durationMin,
    totalPrice,
  };
}
