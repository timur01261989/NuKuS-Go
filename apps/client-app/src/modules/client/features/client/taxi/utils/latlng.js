// Utility helpers for leaflet/map coordinates
export function toNum(v) {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export function isValidLatLng(ll) {
  if (!ll || !Array.isArray(ll) || ll.length < 2) return false;
  const lat = toNum(ll[0]);
  const lng = toNum(ll[1]);
  return lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export function normalizeLatLng(ll) {
  if (!isValidLatLng(ll)) return null;
  return [toNum(ll[0]), toNum(ll[1])];
}

export function safeLatLng(lat, lng) {
  const ll = [lat, lng];
  return normalizeLatLng(ll);
}
