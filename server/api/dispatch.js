import { applyCors, json, badRequest, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';
import { nowIso } from '../_shared/orders/orderEvents.js';
import { runDispatch } from '../_shared/orders/orderDispatchService.js';
import { enqueueDispatch } from '../_shared/queue/orderDispatchQueue.js';

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

async function dispatchInternal(sb, order, body = {}) {
  const asyncMode = body?.queue === true || body?.async === true;
  if (asyncMode) {
    const queued = await enqueueDispatch({ supabase: sb, order });
    return { offered: 0, queued: true, queue_size: queued.queued };
  }
  return runDispatch({ supabase: sb, order, radiusMeters: 2500, limit: 10 });
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
    const out = await dispatchInternal(sb, order, body);
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
