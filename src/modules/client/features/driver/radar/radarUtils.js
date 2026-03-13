export function haversineMeters(a, b) {
  if (!a || !b) return Infinity;
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad((b.lat || 0) - (a.lat || 0));
  const dLng = toRad((b.lng || 0) - (a.lng || 0));
  const lat1 = toRad(a.lat || 0);
  const lat2 = toRad(b.lat || 0);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(aa));
}

export function normalizeBearing(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return ((n % 360) + 360) % 360;
}

export function bearingDelta(a, b) {
  const aa = normalizeBearing(a);
  const bb = normalizeBearing(b);
  if (aa == null || bb == null) return 0;
  const d = Math.abs(aa - bb) % 360;
  return d > 180 ? 360 - d : d;
}
