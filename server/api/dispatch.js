import { applyCors, json, badRequest, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';

function nowIso() { return new Date().toISOString(); }

async function logOrderEvent(sb, payload) {
  try {
    await sb.from('order_events').insert([{ 
      order_id: payload.order_id,
      actor_user_id: payload.actor_user_id || null,
      actor_role: payload.actor_role || 'system',
      event_code: payload.event_code,
      reason: payload.reason || null,
      payload: payload.payload || {},
      from_status: payload.from_status || null,
      to_status: payload.to_status || null,
    }]);
  } catch (_) {}
}

async function driverPing(req, res, body) {
  const sb = getSupabaseAdmin();
  const authedUserId = await getAuthedUserId(req, sb);
  const explicitDriverId = String(body.driver_id || body.driverId || '').trim();
  const driver_id = authedUserId || explicitDriverId;
  if (!driver_id) return badRequest(res, 'Auth driver kerak');
  if (authedUserId && explicitDriverId && authedUserId !== explicitDriverId) return json(res, 403, { ok: false, error: 'driver_id token user_id bilan mos emas' });

  const { data: driver } = await sb.from('drivers').select('user_id,is_verified').eq('user_id', driver_id).maybeSingle();
  if (!driver?.is_verified) return json(res, 403, { ok: false, error: 'Tasdiqlangan driver kerak' });

  const row = {
    driver_id,
    is_online: body.is_online !== false,
    state: String(body.state || (body.is_online === false ? 'offline' : 'online')).toLowerCase(),
    active_service_type: body.active_service_type || body.service_type || null,
    lat: Number.isFinite(Number(body.lat)) ? Number(body.lat) : null,
    lng: Number.isFinite(Number(body.lng)) ? Number(body.lng) : null,
    bearing: Number.isFinite(Number(body.bearing ?? body.heading)) ? Number(body.bearing ?? body.heading) : null,
    speed: Number.isFinite(Number(body.speed)) ? Number(body.speed) : null,
    last_seen_at: nowIso(),
    updated_at: nowIso(),
  };
  const { error } = await sb.from('driver_presence').upsert([row], { onConflict: 'driver_id' });
  if (error) return serverError(res, error);
  return json(res, 200, { ok: true, presence: row });
}

async function resolveOrder(sb, order_id) {
  const { data, error } = await sb.from('orders').select('*').eq('id', order_id).maybeSingle();
  if (error) throw error;
  return data;
}

async function dispatchInternal(sb, order) {
  const { data: activeOffer } = await sb.from('order_offers').select('driver_id,expires_at').eq('order_id', order.id).eq('status', 'sent').gt('expires_at', nowIso()).limit(1).maybeSingle();
  if (activeOffer?.driver_id) return { offered: 0, active_offer: activeOffer };

  const { data: offeredRows } = await sb.from('order_offers').select('driver_id').eq('order_id', order.id).limit(5000);
  const exclude = (offeredRows || []).map((x) => x.driver_id).filter(Boolean);

  const { data: candidates, error } = await sb.rpc('find_eligible_drivers', {
    p_service_type: order.service_type,
    p_cargo_weight_kg: order.cargo_weight_kg,
    p_passenger_count: order.passenger_count,
    p_pickup_lat: order.pickup?.lat ?? null,
    p_pickup_lng: order.pickup?.lng ?? null,
    p_limit: 10,
    p_exclude_driver_ids: exclude,
  });
  if (error) throw error;

  const chosen = Array.isArray(candidates) ? candidates.slice(0, 1) : [];
  if (!chosen.length) return { offered: 0 };
  const expires_at = new Date(Date.now() + 15000).toISOString();
  const rows = chosen.map((d) => ({ order_id: order.id, driver_id: d.driver_id, service_type: order.service_type, dist_km: null, score: null, status: 'sent', sent_at: nowIso(), expires_at }));
  const { error: insErr } = await sb.from('order_offers').upsert(rows, { onConflict: 'order_id,driver_id' });
  if (insErr) throw insErr;
  await sb.from('orders').update({ status: 'offered', offered_at: nowIso(), updated_at: nowIso() }).eq('id', order.id).is('driver_id', null);
  await logOrderEvent(sb, { order_id: order.id, event_code: 'order.offer_sent', payload: { driver_id: rows[0].driver_id, service_type: order.service_type }, to_status: 'offered' });
  return { offered: rows.length, drivers: chosen.map((x) => ({ driver_id: x.driver_id })) };
}

export async function dispatch_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (body.action === 'driver_ping') return driverPing(req, res, body);
    const order_id = String(body.order_id || '').trim();
    if (!order_id) return badRequest(res, 'order_id kerak');
    const sb = getSupabaseAdmin();
    const order = await resolveOrder(sb, order_id);
    if (!order) return json(res, 404, { ok: false, error: 'Order topilmadi' });
    const out = await dispatchInternal(sb, order);
    return json(res, 200, { ok: true, ...out });
  } catch (e) {
    return serverError(res, e);
  }
}

export async function dispatch_smart_handler(req, res) {
  return dispatch_handler(req, res);
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });
  const rk = String(req.routeKey || 'dispatch');
  if (rk === 'dispatch-smart') return dispatch_smart_handler(req, res);
  return dispatch_handler(req, res);
}
