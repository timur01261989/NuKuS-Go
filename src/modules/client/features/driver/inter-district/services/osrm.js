function toRad(x) {
  return (x * Math.PI) / 180;
}

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

// OSRM yo'nalish topa olmasa ham xato bermaslik uchun
export async function osrmRoute(from, to, signal) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=false`;
    const res = await fetch(url, { signal });
    const data = await res.json();
    const r = data?.routes?.[0];
    if (r) {
      return {
        distanceKm: (r.distance || 0) / 1000,
        durationMin: (r.duration || 0) / 60,
      };
    }
  } catch (e) {
    if (e?.name !== 'AbortError') console.warn("OSRM xatolik:", e);
  }
  const d = haversineKm(from, to);
  return {
    distanceKm: d,
    durationMin: d * 2,
  };
}
