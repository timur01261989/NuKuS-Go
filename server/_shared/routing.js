// server/_shared/routing.js
// Road routing via OSRM (recommended self-host) or any Directions API.
// Returns { distance_km, duration_sec, geometry? }
export async function routeByRoad({ osrmBaseUrl, from, to }) {
  if (!osrmBaseUrl) throw new Error('OSRM_BASE_URL missing');
  const url = `${osrmBaseUrl}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false&steps=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data?.routes?.[0]) throw new Error('osrm_route_failed');
  const r = data.routes[0];
  return { distance_km: (r.distance || 0) / 1000, duration_sec: Math.round(r.duration || 0) };
}