import { json, badRequest, serverError } from './_lib.js';

/**
 * GET /api/eta?distance_km=12.3&speed_kmh=30
 * Very simple ETA calculator (demo). Replace with routing engine later.
 */
export default async function handler(req, res) {
  try {
    const distance_km = Number(req.query?.distance_km || 0);
    const speed_kmh = Number(req.query?.speed_kmh || 25);
    if (!Number.isFinite(distance_km) || distance_km < 0) return badRequest(res, 'distance_km noto‘g‘ri');
    if (!Number.isFinite(speed_kmh) || speed_kmh <= 0) return badRequest(res, 'speed_kmh noto‘g‘ri');

    const eta_seconds = Math.round((distance_km / speed_kmh) * 3600);
    return json(res, 200, { ok: true, eta_seconds, distance_km, speed_kmh });
  } catch (e) {
    return serverError(res, e);
  }
}
