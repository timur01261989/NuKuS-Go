// Default routing provider (free): OSRM
const OSRM_BASE = (
  import.meta?.env?.VITE_OSRM_BASE_URL ||
  'https://router.project-osrm.org'
).replace(/\/$/, '');

function num(n) {
  return Number(n);
}

export async function osrmRoute({
  pickup,
  dropoff,
  overview = 'full',
  geometries = 'geojson', // MUHIM: polyline emas
}) {
  if (
    !pickup?.lat || !pickup?.lng ||
    !dropoff?.lat || !dropoff?.lng
  ) {
    throw new Error('pickup/dropoff lat/lng kerak');
  }

  // OSRM format: lng,lat
  const coords =
    `${num(pickup.lng)},${num(pickup.lat)};` +
    `${num(dropoff.lng)},${num(dropoff.lat)}`;

  const url =
    `${OSRM_BASE}/route/v1/driving/${coords}` +
    `?overview=${overview}&geometries=${geometries}`;

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.code !== 'Ok') {
    throw new Error(data?.message || 'OSRM error');
  }

  const route = data.routes?.[0];
  if (!route) throw new Error('OSRM route topilmadi');

  const distance_m = route.distance ?? 0;
  const duration_s = route.duration ?? 0;

  return {
    provider: 'OSRM',

    // UI uchun qulay
    distance_m,
    distance_km: +(distance_m / 1000).toFixed(2),
    duration_s,
    duration_min: Math.ceil(duration_s / 60),

    // Map uchun
    geometry: route.geometry, // GeoJSON LineString
    coordinates: route.geometry?.coordinates ?? [],

    raw: data,
  };
}
