import { emitOrderEvent, nowIso } from './orderEvents.js';

function buildExpiresAt(ttlMs = 15000) {
  return new Date(Date.now() + Math.max(5000, Number(ttlMs) || 15000)).toISOString();
}

export async function createOrderOffers(supabase, {
  order,
  drivers,
  ttlMs = 15000,
}) {
  const list = Array.isArray(drivers) ? drivers : [];
  if (!order?.id || !list.length) return { ok: true, offers: [], offered: 0 };

  const sent_at = nowIso();
  const expires_at = buildExpiresAt(ttlMs);
  const rows = list.map((driver) => ({
    order_id: order.id,
    driver_id: driver.driver_id || driver.id,
    service_type: order.service_type || 'taxi',
    dist_km: Number.isFinite(Number(driver.dist_km)) ? Number(driver.dist_km) : null,
    score: Number.isFinite(Number(driver.score)) ? Number(driver.score) : null,
    status: 'sent',
    sent_at,
    expires_at,
  })).filter((row) => row.driver_id);

  if (!rows.length) return { ok: true, offers: [], offered: 0 };

  const { data, error } = await supabase
    .from('order_offers')
    .upsert(rows, { onConflict: 'order_id,driver_id' })
    .select('id,order_id,driver_id,status,sent_at,expires_at');
  if (error) throw error;

  await emitOrderEvent(supabase, {
    order_id: order.id,
    event_code: 'order.offers_created',
    actor_role: 'system',
    from_status: order.status || null,
    to_status: 'offered',
    payload: {
      service_type: order.service_type || 'taxi',
      driver_ids: rows.map((x) => x.driver_id),
      ttl_ms: ttlMs,
      offered_count: rows.length,
    },
  });

  return { ok: true, offers: Array.isArray(data) ? data : rows, offered: rows.length, expires_at };
}

export async function acceptOrderOffer(supabase, {
  orderId,
  driverId,
}) {
  const safeOrderId = String(orderId || '').trim();
  const safeDriverId = String(driverId || '').trim();
  if (!safeOrderId || !safeDriverId) throw new Error('orderId va driverId kerak');

  const { data: offer, error: offerError } = await supabase
    .from('order_offers')
    .select('id,order_id,driver_id,status,expires_at')
    .eq('order_id', safeOrderId)
    .eq('driver_id', safeDriverId)
    .maybeSingle();
  if (offerError) throw offerError;
  if (!offer) throw new Error('offer_not_found');
  if (offer.status !== 'sent' && offer.status !== 'accepted') throw new Error('offer_not_available');
  if (offer.expires_at && new Date(offer.expires_at).getTime() < Date.now()) throw new Error('offer_expired');

  const { data: orderBefore, error: orderBeforeError } = await supabase
    .from('orders')
    .select('id,status,driver_id,service_type')
    .eq('id', safeOrderId)
    .maybeSingle();
  if (orderBeforeError) throw orderBeforeError;
  if (!orderBefore) throw new Error('order_not_found');
  if (orderBefore.driver_id && String(orderBefore.driver_id) !== safeDriverId) throw new Error('order_taken');

  // Enforce atomic order assignment and race protection in DB.
  const { data: acceptResult, error: acceptError } = await supabase.rpc('accept_order_atomic', {
    p_order_id: safeOrderId,
    p_driver_id: safeDriverId,
  });

  if (acceptError) {
    if (/Order already assigned|order_already_taken|Order not found/i.test(acceptError.message || '')) {
      throw new Error('order_already_taken');
    }
    throw acceptError;
  }

  // Accept only this offer and reject the rest after the order has been reserved.
  const { error: offerAcceptError } = await supabase
    .from('order_offers')
    .update({ status: 'accepted', responded_at: nowIso() })
    .eq('order_id', safeOrderId)
    .eq('driver_id', safeDriverId)
    .in('status', ['sent', 'accepted']);
  if (offerAcceptError) throw offerAcceptError;

  const { error: rejectOthersError } = await supabase
    .from('order_offers')
    .update({ status: 'rejected', responded_at: nowIso() })
    .eq('order_id', safeOrderId)
    .neq('driver_id', safeDriverId)
    .eq('status', 'sent');
  if (rejectOthersError) throw rejectOthersError;

  const { data: orderAfter, error: orderAfterError } = await supabase
    .from('orders')
    .select('id,status,driver_id,service_type,pickup,dropoff,price_uzs,user_id')
    .eq('id', safeOrderId)
    .maybeSingle();

  if (orderAfterError) throw orderAfterError;
  if (!orderAfter) throw new Error('order_not_found_after_accept');

  const effectiveOrder = orderAfter; 

  await emitOrderEvent(supabase, {
    order_id: safeOrderId,
    event_code: 'order.driver_assigned',
    actor_user_id: safeDriverId,
    actor_role: 'driver',
    from_status: orderBefore.status || 'offered',
    to_status: 'accepted',
    payload: {
      driver_id: safeDriverId,
      service_type: effectiveOrder.service_type || orderBefore.service_type || 'taxi',
    },
  });

  return { ok: true, order: effectiveOrder };
}

export async function rejectOrderOffer(supabase, {
  orderId,
  driverId,
  reason = 'declined',
}) {
  const safeOrderId = String(orderId || '').trim();
  const safeDriverId = String(driverId || '').trim();
  if (!safeOrderId || !safeDriverId) throw new Error('orderId va driverId kerak');
  const { data, error } = await supabase
    .from('order_offers')
    .update({ status: 'rejected', responded_at: nowIso() })
    .eq('order_id', safeOrderId)
    .eq('driver_id', safeDriverId)
    .in('status', ['sent', 'accepted'])
    .select('id,order_id,driver_id,status,responded_at')
    .maybeSingle();
  if (error) throw error;

  await emitOrderEvent(supabase, {
    order_id: safeOrderId,
    event_code: 'order.offer_rejected',
    actor_user_id: safeDriverId,
    actor_role: 'driver',
    from_status: 'offered',
    to_status: 'offered',
    reason,
    payload: { driver_id: safeDriverId },
  });

  return { ok: true, offer: data || null };
}

export async function expireStaleOffers(supabase) {
  const now = nowIso();
  const { data, error } = await supabase
    .from('order_offers')
    .update({ status: 'expired', responded_at: now })
    .eq('status', 'sent')
    .lt('expires_at', now)
    .select('id,order_id,driver_id,status,expires_at');
  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  for (const row of rows) {
    try {
      await emitOrderEvent(supabase, {
        order_id: row.order_id,
        event_code: 'order.offer_expired',
        actor_user_id: row.driver_id,
        actor_role: 'driver',
        from_status: 'offered',
        to_status: 'offered',
        payload: { driver_id: row.driver_id },
      });
    } catch {}
  }

  return { ok: true, updated: rows.length, offers: rows };
}
