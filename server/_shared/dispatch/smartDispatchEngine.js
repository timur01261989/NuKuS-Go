import { dispatchBatch } from '../orders/orderDispatchBatch.js';
import { estimateDriverEtaMinutes } from '../eta/orderEtaService.js';
import { sortDriversByScore } from './smartDispatchScore.js';

function computeSmartScore(candidate, order) {
  const eta = estimateDriverEtaMinutes({
    driverLat: candidate.lat,
    driverLng: candidate.lng,
    pickupLat: order?.pickup?.lat,
    pickupLng: order?.pickup?.lng,
  });
  const rating = Number(candidate.rating || 4.5);
  const acceptance = Number(candidate.acceptance_rate || 0.5);
  const distanceScore = Math.max(0, 50 - ((candidate.dist_km || eta.distance_km || 10) * 8));
  return {
    ...candidate,
    eta_min: eta.eta_min,
    eta_distance_km: eta.distance_km,
    smart_score: Number((distanceScore + (rating * 10) + (acceptance * 20)).toFixed(2)),
  };
}

export async function buildSmartDispatchBatch({ supabase, order, radiusMeters = 2500, limit = 10 }) {
  const batch = await dispatchBatch({ supabase, order, radiusMeters, limit: Math.max(20, limit * 2) });
  const enriched = batch.map((candidate) => computeSmartScore(candidate, order));
  return sortDriversByScore(enriched, order).slice(0, limit);
}
