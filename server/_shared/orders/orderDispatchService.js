import { getActiveOffer, getOrderOffers, findEligibleDrivers, insertOrderOffers, updateOrderStatusRecord } from './orderRepository.js';
import { logOrderEvent } from './orderEvents.js';

function nowIso() {
  return new Date().toISOString();
}

export async function dispatchOrderToDrivers(sb, order) {
  const activeOffer = await getActiveOffer(sb, order.id, nowIso());
  if (activeOffer?.driver_id) {
    return { offered: 0, active_offer: activeOffer };
  }

  const priorOffers = await getOrderOffers(sb, order.id);
  const excludeDriverIds = priorOffers.map((row) => row.driver_id).filter(Boolean);

  const candidates = await findEligibleDrivers(sb, {
    p_service_type: order.service_type,
    p_cargo_weight_kg: order.cargo_weight_kg,
    p_passenger_count: order.passenger_count,
    p_pickup_lat: order.pickup?.lat ?? null,
    p_pickup_lng: order.pickup?.lng ?? null,
    p_limit: 10,
    p_exclude_driver_ids: excludeDriverIds,
  });

  const chosen = candidates.slice(0, 1);
  if (!chosen.length) return { offered: 0, drivers: [] };

  const expiresAt = new Date(Date.now() + 15000).toISOString();
  const rows = chosen.map((driver) => ({
    order_id: order.id,
    driver_id: driver.driver_id,
    service_type: order.service_type,
    dist_km: null,
    score: null,
    status: 'sent',
    sent_at: nowIso(),
    expires_at: expiresAt,
  }));

  await insertOrderOffers(sb, rows);
  await updateOrderStatusRecord(sb, order.id, {
    status: 'offered',
    offered_at: nowIso(),
    updated_at: nowIso(),
  });
  await logOrderEvent(sb, {
    order_id: order.id,
    actor_role: 'system',
    event_code: 'order.offer_sent',
    to_status: 'offered',
    payload: {
      driver_id: rows[0].driver_id,
      service_type: order.service_type,
    },
  });

  return {
    offered: rows.length,
    drivers: chosen.map((row) => ({ driver_id: row.driver_id })),
  };
}
