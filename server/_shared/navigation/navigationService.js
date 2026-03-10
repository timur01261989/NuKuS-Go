function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

export function buildNavigationPreview({ from, to, avgSpeedKmh = 28 }) {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) {
    return { ok: false, route: [], distance_km: 0, eta_min: null };
  }
  const distance_km = haversineKm(from.lat, from.lng, to.lat, to.lng);
  const eta_min = Math.max(1, Math.round((distance_km / Math.max(10, Number(avgSpeedKmh) || 28)) * 60));
  return {
    ok: true,
    route: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
    distance_km: Number(distance_km.toFixed(2)),
    eta_min,
  };
}
