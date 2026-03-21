/**
 * OSRM route helper (standalone).
 * You can swap to your backend later.
 */
export async function osrmRouteMulti(points) {
  if (!points || points.length < 2) return null;
  const coords = points.map((p) => `${p[1]},${p[0]}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  const r = data?.routes?.[0];
  if (!r) return null;
  return {
    coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: (r.distance || 0) / 1000,
    durationMin: (r.duration || 0) / 60,
  };
}
