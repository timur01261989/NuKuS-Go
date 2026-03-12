function buildSimplePolyline(fromLat, fromLng, toLat, toLng) {
  return [
    [Number(fromLat), Number(fromLng)],
    [Number(toLat), Number(toLng)],
  ];
}

export async function getOsrmRoute({ fromLat, fromLng, toLat, toLng, includeGeometry = false }) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=${includeGeometry ? 'full' : 'false'}&geometries=geojson`;
  const r = await fetch(url);
  const j = await r.json();
  const route = j.routes?.[0];
  const polyline = includeGeometry
    ? (route?.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng])
    : buildSimplePolyline(fromLat, fromLng, toLat, toLng);
  return {
    distance_m: route?.distance || 0,
    duration_s: route?.duration || 0,
    polyline,
  };
}

export async function getOsrmRouteWithWaypoints({ points = [] }) {
  const validPoints = (Array.isArray(points) ? points : []).filter((item) => Number.isFinite(Number(item?.lat)) && Number.isFinite(Number(item?.lng)));
  if (validPoints.length < 2) return { distance_m: 0, duration_s: 0, polyline: [] };
  const coordinates = validPoints.map((item) => `${Number(item.lng)},${Number(item.lat)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
  const r = await fetch(url);
  const j = await r.json();
  const route = j.routes?.[0];
  return {
    distance_m: route?.distance || 0,
    duration_s: route?.duration || 0,
    polyline: (route?.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]),
  };
}

export function estimateDetourKm(polyline = [], pickupPoint = null, dropoffPoint = null) {
  const nodes = Array.isArray(polyline) ? polyline : [];
  const extras = [pickupPoint, dropoffPoint].filter(Boolean);
  if (!nodes.length || !extras.length) return 0;
  const origin = nodes[0];
  const destination = nodes[nodes.length - 1];
  const simple = (a, b) => {
    const la1 = Number(a?.[0] ?? a?.lat ?? 0);
    const lo1 = Number(a?.[1] ?? a?.lng ?? 0);
    const la2 = Number(b?.[0] ?? b?.lat ?? 0);
    const lo2 = Number(b?.[1] ?? b?.lng ?? 0);
    const dx = la2 - la1;
    const dy = lo2 - lo1;
    return Math.sqrt(dx * dx + dy * dy) * 111;
  };
  return Number((simple(origin, pickupPoint) + simple(dropoffPoint, destination)).toFixed(2));
}
