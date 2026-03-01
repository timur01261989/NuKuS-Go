export async function osrmRouteDriving(points) {
  // points: [[lat,lng], [lat,lng], ...]
  try {
    if (!Array.isArray(points) || points.length < 2) return null;
    const coords = points
      .filter((p) => Array.isArray(p) && p.length === 2 && Number.isFinite(+p[0]) && Number.isFinite(+p[1]))
      .map((p) => `${p[1]},${p[0]}`)
      .join(";");
    if (!coords || coords.split(";").length < 2) return null;

    const url =
      `https://router.project-osrm.org/route/v1/driving/${coords}` +
      `?overview=full&geometries=geojson&steps=false&annotations=false`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const r = data?.routes?.[0];
    if (!r?.geometry?.coordinates?.length) return null;

    const latlng = r.geometry.coordinates.map((c) => [c[1], c[0]]);
    return {
      distance_m: r.distance ?? null,
      duration_s: r.duration ?? null,
      coords: latlng,
    };
  } catch (e) {
    return null;
  }
}

export function haversineKm(a, b) {
  if (!a || !b) return 0;
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sin1 = Math.sin(dLat / 2) ** 2;
  const sin2 = Math.sin(dLng / 2) ** 2;
  const c =
    2 *
    Math.atan2(
      Math.sqrt(sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2),
      Math.sqrt(1 - (sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2))
    );
  return R * c;
}
