import { applyCors, json, badRequest, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';
import { getOrderById, upsertDriverPresence } from '../_shared/orders/orderRepository.js';
import { dispatchOrderToDrivers } from '../_shared/orders/orderDispatchService.js';

function nowIso() {
  return new Date().toISOString();
}

async function driverPing(req, res, body) {
  const sb = getSupabaseAdmin();
  const authedUserId = await getAuthedUserId(req, sb);
  const explicitDriverId = String(body.driver_id || body.driverId || '').trim();
  const driverId = authedUserId || explicitDriverId;
  if (!driverId) return badRequest(res, 'Auth driver kerak');
  if (authedUserId && explicitDriverId && authedUserId !== explicitDriverId) {
    return json(res, 403, { ok: false, error: 'driver_id token user_id bilan mos emas' });
  }

  const { data: driver } = await sb.from('drivers').select('user_id,is_verified').eq('user_id', driverId).maybeSingle();
  if (!driver?.is_verified) return json(res, 403, { ok: false, error: 'Tasdiqlangan driver kerak' });

  const row = {
    driver_id: driverId,
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
  await upsertDriverPresence(sb, row);
  return json(res, 200, { ok: true, presence: row });
}

export async function dispatch_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    if (body.action === 'driver_ping') return driverPing(req, res, body);
    const orderId = String(body.order_id || '').trim();
    if (!orderId) return badRequest(res, 'order_id kerak');
    const sb = getSupabaseAdmin();
    const order = await getOrderById(sb, orderId);
    if (!order) return json(res, 404, { ok: false, error: 'Order topilmadi' });
    const result = await dispatchOrderToDrivers(sb, order);
    return json(res, 200, { ok: true, ...result });
  } catch (error) {
    return serverError(res, error);
  }
}

export async function dispatch_smart_handler(req, res) {
  return dispatch_handler(req, res);
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });
  const routeKey = String(req.routeKey || 'dispatch');
  if (routeKey === 'dispatch-smart') return dispatch_smart_handler(req, res);
  return dispatch_handler(req, res);
}
