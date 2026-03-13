export function toRad(v) {
  return (v * Math.PI) / 180;
}

// Haversine distance (meters)
export function distanceMeters(a, b) {
  if (!a || !b) return 0;

  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);

  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}
