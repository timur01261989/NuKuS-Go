export function normalizePoint(point) {
  if (!point) return null;
  if (Array.isArray(point) && point.length >= 2) {
    const lat = Number(point[0]);
    const lng = Number(point[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  }
  const lat = Number(point.lat ?? point.latitude ?? point.y);
  const lng = Number(point.lng ?? point.lon ?? point.longitude ?? point.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function haversineKm(a, b) {
  const p1 = normalizePoint(a);
  const p2 = normalizePoint(b);
  if (!p1 || !p2) return Infinity;
  const R = 6371;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

export function nearestPolylineDistanceKm(point, polyline = []) {
  const p = normalizePoint(point);
  if (!p || !Array.isArray(polyline) || polyline.length === 0) return Infinity;
  let best = Infinity;
  for (const node of polyline) {
    const np = normalizePoint(node);
    if (!np) continue;
    const d = haversineKm(p, np);
    if (d < best) best = d;
  }
  return best;
}

export function buildTripCorridor(trip = {}) {
  const from = normalizePoint(trip.from_point ?? trip.pickup ?? trip.origin ?? trip.route_meta?.from_point);
  const to = normalizePoint(trip.to_point ?? trip.dropoff ?? trip.destination ?? trip.route_meta?.to_point);
  const polyline = Array.isArray(trip.route_polyline)
    ? trip.route_polyline
    : Array.isArray(trip.route_meta?.polyline)
      ? trip.route_meta.polyline
      : [from, to].filter(Boolean);
  return {
    from,
    to,
    polyline: polyline.filter(Boolean),
    maxDetourKm: Number(trip.max_detour_km ?? trip.route_meta?.max_detour_km ?? 8),
    pickupRadiusKm: Number(trip.pickup_radius_km ?? trip.route_meta?.pickup_radius_km ?? 3),
    dropoffRadiusKm: Number(trip.dropoff_radius_km ?? trip.route_meta?.dropoff_radius_km ?? 3),
  };
}

export function scoreTripAgainstRequest(trip, request = {}) {
  const corridor = buildTripCorridor(trip);
  const reqFrom = normalizePoint(request.from_point ?? request.pickup ?? request.origin);
  const reqTo = normalizePoint(request.to_point ?? request.dropoff ?? request.destination);
  if (!corridor.from || !corridor.to || !reqFrom || !reqTo) {
    return {
      matched: false,
      score: 0,
      reason: 'missing_points',
      pickupDistanceKm: Infinity,
      dropoffDistanceKm: Infinity,
      matchType: 'none',
    };
  }

  const pickupDistanceKm = nearestPolylineDistanceKm(reqFrom, corridor.polyline);
  const dropoffDistanceKm = nearestPolylineDistanceKm(reqTo, corridor.polyline);
  const exactFromKm = haversineKm(reqFrom, corridor.from);
  const exactToKm = haversineKm(reqTo, corridor.to);
  const withinPickup = pickupDistanceKm <= corridor.pickupRadiusKm;
  const withinDropoff = dropoffDistanceKm <= corridor.dropoffRadiusKm;
  const matched = withinPickup && withinDropoff;

  let score = 0;
  if (matched) {
    score = 100;
    score -= Math.min(35, pickupDistanceKm * 8);
    score -= Math.min(35, dropoffDistanceKm * 8);
    score -= Math.min(20, exactFromKm * 2.5);
    score -= Math.min(20, exactToKm * 2.5);
    score = Math.max(1, Math.round(score));
  }

  const matchType = exactFromKm <= 1 && exactToKm <= 1 ? 'exact' : matched ? 'corridor' : 'none';

  return {
    matched,
    score,
    matchType,
    pickupDistanceKm: Number.isFinite(pickupDistanceKm) ? Number(pickupDistanceKm.toFixed(2)) : null,
    dropoffDistanceKm: Number.isFinite(dropoffDistanceKm) ? Number(dropoffDistanceKm.toFixed(2)) : null,
    exactFromKm: Number.isFinite(exactFromKm) ? Number(exactFromKm.toFixed(2)) : null,
    exactToKm: Number.isFinite(exactToKm) ? Number(exactToKm.toFixed(2)) : null,
  };
}

export function enrichTripsWithCorridorScore(trips = [], request = {}) {
  return (Array.isArray(trips) ? trips : []).map((trip) => {
    const match = scoreTripAgainstRequest(trip, request);
    return {
      ...trip,
      corridor_match: match,
      match_score: match.score,
      match_type: match.matchType,
      pickup_distance_km: match.pickupDistanceKm,
      dropoff_distance_km: match.dropoffDistanceKm,
    };
  });
}
