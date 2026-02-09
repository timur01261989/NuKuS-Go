// Default routing provider (free): OSRM
const OSRM_BASE = (import.meta?.env?.VITE_OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');

function toStr(n){ return String(Number(n)); }

export async function osrmRoute({ pickup, dropoff, overview='full', geometries='polyline' }) {
  if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) {
    throw new Error('pickup/dropoff lat/lng kerak');
  }
  const coords = `${toStr(pickup.lng)},${toStr(pickup.lat)};${toStr(dropoff.lng)},${toStr(dropoff.lat)}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=${encodeURIComponent(overview)}&geometries=${encodeURIComponent(geometries)}`;

  const r = await fetch(url);
  const j = await r.json().catch(()=>({}));
  if (!r.ok || j?.code !== 'Ok') throw new Error(j?.message || `OSRM error`);

  const route = j.routes?.[0];
  const distance_m = route?.distance ?? 0;
  const duration_s = route?.duration ?? 0;
  const polyline = route?.geometry ?? null;

  return {
    provider: 'OSRM',
    distance_km: distance_m / 1000,
    duration_min: duration_s / 60,
    eta_seconds: Math.round(duration_s),
    polyline,
    raw: j,
  };
}
