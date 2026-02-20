// Shared OSRM routing helper with safe fallback.
// Returns same shape used across client services: { coords, distanceKm, durationMin }.
import { haversineKm } from "./haversine";

export async function osrmRoute(from, to, options = {}) {
  const signal = options?.signal;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url, signal ? { signal } : undefined);
    const data = await res.json();
    const r = data?.routes?.[0];
    if (r) {
      return {
        coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distanceKm: (r.distance || 0) / 1000,
        durationMin: (r.duration || 0) / 60,
      };
    }
  } catch (e) {
    // Keep existing behavior: ignore abort; warn otherwise; then fallback.
    if (e?.name !== "AbortError") console.warn("OSRM route xato:", e);
  }

  const km = haversineKm(from, to);
  return { coords: [from, to], distanceKm: km, durationMin: km * 2 };
}

// Multi-point route (used by Taxi map)
export async function osrmRouteMulti(points, options = {}) {
  const signal = options?.signal;
  try {
    const coords = (points || []).map((p) => `${p[1]},${p[0]}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const res = await fetch(url, signal ? { signal } : undefined);
    const data = await res.json();
    const r = data?.routes?.[0];
    if (r) {
      return {
        coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distanceKm: (r.distance || 0) / 1000,
        durationMin: (r.duration || 0) / 60,
      };
    }
  } catch (e) {
    if (e?.name !== "AbortError") console.warn("OSRM multi-route xato:", e);
  }

  // fallback: polyline is direct segments, meta is summed haversine
  const pts = points || [];
  let km = 0;
  for (let i = 1; i < pts.length; i++) km += haversineKm(pts[i - 1], pts[i]);
  return { coords: pts, distanceKm: km, durationMin: km * 2 };
}
