/**
 * Haversine distance calculation (km)
 */
export function haversineKm(a, b) {
  if (!a || !b) return 0;

  const toRad = (v) => (v * Math.PI) / 180;

  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);

  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const sin1 = Math.sin(dLat / 2) ** 2;
  const sin2 = Math.sin(dLng / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2),
      Math.sqrt(1 - (sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2))
    );

  return R * c;
}
