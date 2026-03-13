import { findDriversInRadius } from './orderDriverSearch.js';

function scoreDriver(row) {
  const rating = Number.isFinite(Number(row.rating)) ? Number(row.rating) : 4.5;
  const acceptanceRate = Number.isFinite(Number(row.acceptance_rate)) ? Number(row.acceptance_rate) : 0.5;
  const dist = Number.isFinite(Number(row.dist_km)) ? Number(row.dist_km) : 9999;
  const recent = row.last_seen_at || row.updated_at ? Date.parse(row.last_seen_at || row.updated_at) : Date.now() - 60000;
  const freshnessPenalty = Math.max(0, (Date.now() - recent) / 1000 / 60);
  return (rating * 20) + (acceptanceRate * 30) - (dist * 10) - freshnessPenalty;
}

export async function dispatchBatch({ supabase, order, radiusMeters = 2000, limit = 10 }) {
  if (!order?.pickup?.lat || !order?.pickup?.lng) return [];
  const candidates = await findDriversInRadius({
    supabase,
    lat: order.pickup.lat,
    lng: order.pickup.lng,
    radiusMeters,
    serviceType: order.service_type || 'taxi',
    limit: Math.max(limit * 3, 30),
  });

  return candidates
    .filter((row) => row.is_online !== false)
    .sort((a, b) => scoreDriver(b) - scoreDriver(a))
    .slice(0, limit)
    .map((row) => ({
      driver_id: row.driver_id || row.id,
      dist_km: Number.isFinite(Number(row.dist_km)) ? Number(row.dist_km) : null,
      score: scoreDriver(row),
      rating: row.rating ?? null,
      acceptance_rate: row.acceptance_rate ?? null,
    }));
}
