import { useMemo } from "react";

const WEIGHT_MULT = {
  1: 1.0, // <1kg
  2: 1.15, // 5kg
  3: 1.3, // 10kg
  4: 1.55, // 20kg+
};

export function useDeliveryPrice({ distanceKm, weightCategory, doorToDoor, parcelType }) {
  return useMemo(() => {
    const km = Math.max(0, Number(distanceKm) || 0);

    // Bazaviy tarif (parcelType ga qarab ham farq qilsa bo'ladi)
    const base = parcelType === "flowers" ? 22000 : 18000;

    // km narxi
    const perKm = 2500;

    const mult = WEIGHT_MULT[weightCategory] || 1.0;

    const doorFee = doorToDoor ? 5000 : 0;

    const price = Math.round((base + km * perKm) * mult + doorFee);
    return { base, perKm, mult, doorFee, price };
  }, [distanceKm, weightCategory, doorToDoor, parcelType]);
}
