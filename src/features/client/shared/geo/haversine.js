// Shared geo distance helpers (do not change behavior across services)
// Supports points as [lat, lng] arrays or { lat, lng } objects.
export function normalizeLatLng(p) {
  if (!p) return null;
  if (Array.isArray(p)) return { lat: Number(p[0]), lng: Number(p[1]) };
  if (typeof p === "object" && p !== null) return { lat: Number(p.lat), lng: Number(p.lng) };
  return null;
}

export function haversineKm(a, b) {
  const A = normalizeLatLng(a);
  const B = normalizeLatLng(b);
  if (!A || !B || !isFinite(A.lat) || !isFinite(A.lng) || !isFinite(B.lat) || !isFinite(B.lng)) return 0;

  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(B.lat - A.lat);
  const dLng = toRad(B.lng - A.lng);

  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);

  const q = s1 * s1 + Math.cos(toRad(A.lat)) * Math.cos(toRad(B.lat)) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(q)));
}
