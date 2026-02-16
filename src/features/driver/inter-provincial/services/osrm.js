import { haversineKm } from "../utils/geo";

// OSRM yo'nalish topa olmasa ham xato bermaslik uchun
export async function osrmRoute(from, to, signal) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal });
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
    if (e?.name !== "AbortError") console.warn("OSRM route xatolik:", e);
  }
  const km = haversineKm(from, to);
  return {
    coords: [from, to],
    distanceKm: km,
    durationMin: km * 2,
  };
}
