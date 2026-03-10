import { useMemo } from 'react';

function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

export function useEtaPrediction(driverLocation, pickupLocation, avgCitySpeedKmh = 24) {
  return useMemo(() => {
    if (!driverLocation?.lat || !driverLocation?.lng || !pickupLocation?.lat || !pickupLocation?.lng) {
      return { etaMin: null, distanceKm: null };
    }
    const distanceKm = haversineKm(driverLocation.lat, driverLocation.lng, pickupLocation.lat, pickupLocation.lng);
    const etaMin = Math.max(1, Math.round((distanceKm / Math.max(8, Number(avgCitySpeedKmh) || 24)) * 60));
    return { etaMin, distanceKm: Number(distanceKm.toFixed(2)) };
  }, [driverLocation?.lat, driverLocation?.lng, pickupLocation?.lat, pickupLocation?.lng, avgCitySpeedKmh]);
}
