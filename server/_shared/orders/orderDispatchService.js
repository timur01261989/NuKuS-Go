import { nowIso, emitOrderEvent } from './orderEvents.js';
import { createOrderOffers } from './orderOfferService.js';
import { buildSmartDispatchBatch } from '../dispatch/smartDispatchEngine.js';
import { buildDispatchRetryState, markDispatchRetryQueued } from './orderDispatchRetry.js';
import { buildDemandSnapshot } from '../ai/demandPredictionService.js';

export async function runDispatch({ supabase, order, radiusMeters = 2500, limit = 10 }) {
  if (!supabase || !order?.id) {
    throw new Error('invalid_dispatch_context');
  }

  const { data: activeOffer } = await supabase
    .from('order_offers')
    .select('driver_id,expires_at')
    .eq('order_id', order.id)
    .eq('status', 'sent')
    .gt('expires_at', nowIso())
    .limit(1)
    .maybeSingle();

  if (activeOffer?.driver_id) {
    return { offered: 0, active_offer: activeOffer, demand: null };
  }

  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('status', ['searching', 'offered', 'accepted', 'arrived', 'in_progress']);
  const { count: activeOrdersCount = 0 } = activeOrders || {};

  const { data: onlineDrivers } = await supabase
    .from('driver_presence')
    .select('driver_id', { count: 'exact', head: true })
    .eq('is_online', true);
  const { count: onlineDriversCount = 0 } = onlineDrivers || {};

  const demand = buildDemandSnapshot({
    activeOrders: activeOrdersCount,
    onlineDrivers: onlineDriversCount,
  });

  const chosen = await buildSmartDispatchBatch({ supabase, order, radiusMeters, limit });
  if (!Array.isArray(chosen) || !chosen.length) {
    const retryState = await buildDispatchRetryState(supabase, order.id);
    if (retryState.shouldRetry) {
      await markDispatchRetryQueued(supabase, order.id, { service_type: order.service_type || 'taxi' });
    }
    return { offered: 0, retry: retryState.shouldRetry, retry_reason: retryState.reason, demand };
  }

  const offerResult = await createOrderOffers(supabase, { order, drivers: chosen, ttlMs: 15000 });
  await supabase
    .from('orders')
    .update({ status: 'offered', offered_at: nowIso(), updated_at: nowIso() })
    .eq('id', order.id)
    .is('driver_id', null);

  await emitOrderEvent(supabase, {
    order_id: order.id,
    event_code: 'order.offer_sent',
    actor_role: 'system',
    payload: {
      service_type: order.service_type,
      surge_multiplier: demand.multiplier,
      driver_ids: chosen.map((x) => x.driver_id),
    },
    to_status: 'offered',
  });

  return {
    offered: offerResult.offered,
    expires_at: offerResult.expires_at,
    drivers: chosen.map((x) => ({ driver_id: x.driver_id, score: x.dispatch_score ?? x.smart_score ?? x.score ?? null })),
    demand,
  };
}
