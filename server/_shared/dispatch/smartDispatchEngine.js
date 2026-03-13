
export function dynamicRadius(order){
  if(!order) return 2500
  if(order.service_type==="freight") return 8000
  if(order.service_type==="intercity") return 15000
  return 3000
}

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
  const acceptance = Number(candidate.acceptance_rate || 0.7);
  const priority = Number(candidate.priority || 0.5);
  const seat = Number(candidate.seat_count || 0);

  const distance = (candidate.dist_km || eta.distance_km || 10);

  const distanceScore = Math.max(0, 1 - distance / 10);
  const ratingScore = rating / 5;
  const acceptanceScore = acceptance;
  const capacityScore =
      seat >= 4 ? 1 :
      seat >= 2 ? 0.7 :
      0.4;

  const priorityScore = priority;

  const finalScore =
      distanceScore * 0.35 +
      ratingScore * 0.20 +
      acceptanceScore * 0.20 +
      capacityScore * 0.15 +
      priorityScore * 0.10;

  return {
    ...candidate,
    eta_min: eta.eta_min,
    eta_distance_km: eta.distance_km,
    smart_score: Number((finalScore * 100).toFixed(2)),
  };
}

export async function buildSmartDispatchBatch({ supabase, order, radiusMeters = 2500, limit = 10 }) {
  const batch = await dispatchBatch({ supabase, order, radiusMeters, limit: Math.max(20, limit * 2) });
  const enriched = batch.map((candidate) => computeSmartScore(candidate, order));
  return sortDriversByScore(enriched, order).slice(0, limit);
}
