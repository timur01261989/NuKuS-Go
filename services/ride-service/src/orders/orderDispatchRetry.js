import { emitOrderEvent } from './orderEvents.js';

export async function buildDispatchRetryState(supabase, orderId) {
  const safeOrderId = String(orderId || '').trim();
  if (!safeOrderId) return { shouldRetry: false, reason: 'missing_order_id' };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,status,driver_id,updated_at')
    .eq('id', safeOrderId)
    .maybeSingle();
  if (orderError) throw orderError;
  if (!order) return { shouldRetry: false, reason: 'order_not_found' };
  if (order.driver_id) return { shouldRetry: false, reason: 'driver_assigned', order };
  if (!['searching', 'offered', 'created'].includes(String(order.status || '').toLowerCase())) {
    return { shouldRetry: false, reason: 'status_not_retryable', order };
  }

  const { data: activeOffers, error: offersError } = await supabase
    .from('order_offers')
    .select('id')
    .eq('order_id', safeOrderId)
    .eq('status', 'sent')
    .gt('expires_at', new Date().toISOString())
    .limit(1);
  if (offersError) throw offersError;
  if (Array.isArray(activeOffers) && activeOffers.length) return { shouldRetry: false, reason: 'active_offer_exists', order };

  return { shouldRetry: true, reason: 'retry_ready', order };
}

export async function markDispatchRetryQueued(supabase, orderId, payload = {}) {
  return emitOrderEvent(supabase, {
    order_id: orderId,
    event_code: 'order.dispatch_retry_queued',
    actor_role: 'system',
    payload,
  });
}
