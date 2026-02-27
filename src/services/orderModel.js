// Add-only: richer Yandex-style order shape helpers (does not break current code)

export function normalizePoint(p) {
  if (!p) return null;
  const lat = Number(p.lat);
  const lng = Number(p.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, address: p.address ? String(p.address) : '' };
}

export function buildOrderRoute({ pickup, dropoff, polyline=null, distance_km=null, duration_min=null, eta_seconds=null }) {
  return {
    pickup: normalizePoint(pickup),
    dropoff: normalizePoint(dropoff),
    polyline,
    distance_km: distance_km == null ? null : Number(distance_km),
    duration_min: duration_min == null ? null : Number(duration_min),
    eta_seconds: eta_seconds == null ? null : Number(eta_seconds),
  };
}
