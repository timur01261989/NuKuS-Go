function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

export function estimateDriverEtaMinutes({ driverLat, driverLng, pickupLat, pickupLng, avgCitySpeedKmh = 24 }) {
  const distanceKm = haversineKm(Number(driverLat || 0), Number(driverLng || 0), Number(pickupLat || 0), Number(pickupLng || 0));
  const speed = Math.max(8, Number(avgCitySpeedKmh) || 24);
  const etaMinutes = Math.max(1, Math.round((distanceKm / speed) * 60));
  return { distance_km: Number(distanceKm.toFixed(2)), eta_min: etaMinutes, avg_speed_kmh: speed };
}
