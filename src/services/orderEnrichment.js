import { buildRoute } from '../providers/route/index.js';
import { buildOrderRoute } from './orderModel.js';

export async function enrichOrderRoute({ pickup, dropoff }) {
  const r = await buildRoute({ pickup, dropoff, overview:'full', geometries:'polyline' });
  const route = buildOrderRoute({
    pickup, dropoff,
    polyline: r.polyline,
    distance_km: r.distance_km,
    duration_min: r.duration_min,
    eta_seconds: r.eta_seconds,
  });
  return { route, polyline: r.polyline, eta_seconds: r.eta_seconds, distance_km: r.distance_km, duration_min: r.duration_min, provider: r.provider };
}
