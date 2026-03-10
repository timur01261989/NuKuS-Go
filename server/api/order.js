import { createClient } from '@supabase/supabase-js';
import { getRequestLang, translatePayload } from '../_shared/serverI18n.js';
import { getAuthedUserId } from '../_shared/supabase.js';
import { buildUnifiedOrderPayload, isTerminalStatus } from '../_shared/orders/orderContract.js';
import { validateCreateOrderPayload, assertOrderId } from '../_shared/orders/orderValidation.js';
import { createOrderRecord, getActiveOrderByClientId, getOrderById, updateOrderStatusRecord } from '../_shared/orders/orderRepository.js';
import { serializeOrderResponse } from '../_shared/orders/orderSerializer.js';
import { logOrderEvent } from '../_shared/orders/orderEvents.js';
import { buildCreateOrderIdempotencyKey } from '../_shared/orders/orderIdempotency.js';

function pickEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && String(value).trim()) return String(value).trim();
  }
  return '';
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function reply(req, res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const lang = getRequestLang(req, payload && typeof payload === 'object' ? payload : null);
  res.end(JSON.stringify(translatePayload(payload, lang)));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getClients(req) {
  const url = pickEnv('SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
  const anon = pickEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const service = pickEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || (!anon && !service)) throw new Error('Missing Supabase env');
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const useAnonWithAuth = authHeader && /^Bearer\s+/i.test(String(authHeader));
  const client = createClient(url, useAnonWithAuth ? anon : service || anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: useAnonWithAuth ? { headers: { Authorization: authHeader } } : undefined,
  });
  const admin = service
    ? createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    : client;
  return { client, admin };
}

function sameLocation(left, right) {
  if (!left || !right) return false;
  const latDiff = Math.abs(Number(left.lat ?? 0) - Number(right.lat ?? 0));
  const lngDiff = Math.abs(Number(left.lng ?? 0) - Number(right.lng ?? 0));
  const a = String(left.address || '').trim().toLowerCase();
  const b = String(right.address || '').trim().toLowerCase();
  return (latDiff < 0.0002 && lngDiff < 0.0002) || (!!a && a === b);
}

async function handleGetOrder(req, res, sb, body) {
  const orderId = assertOrderId(body.order_id || body.id);
  if (!orderId) return reply(req, res, 400, { ok: false, error: 'order_id kerak' });
  const data = await getOrderById(sb, orderId);
  if (!data) return reply(req, res, 404, { ok: false, error: 'Order topilmadi' });
  return reply(req, res, 200, serializeOrderResponse(data));
}

async function handleActiveOrder(req, res, sb) {
  const authedUserId = await getAuthedUserId(req, sb);
  if (!authedUserId) return reply(req, res, 401, { ok: false, error: 'Auth user kerak' });
  const active = await getActiveOrderByClientId(sb, authedUserId);
  if (!active) return reply(req, res, 200, { ok: true, order: null, data: null });
  return reply(req, res, 200, serializeOrderResponse(active));
}

async function handleCancelOrder(req, res, sb, body) {
  const authedUserId = await getAuthedUserId(req, sb);
  const orderId = assertOrderId(body.order_id || body.id);
  if (!authedUserId || !orderId) return reply(req, res, 400, { ok: false, error: 'order_id va auth user kerak' });
  const order = await getOrderById(sb, orderId);
  if (!order) return reply(req, res, 404, { ok: false, error: 'Order topilmadi' });
  if (String(order.client_id || '') !== authedUserId) return reply(req, res, 403, { ok: false, error: 'Bu order sizga tegishli emas' });
  if (isTerminalStatus(order.status)) return reply(req, res, 200, serializeOrderResponse(order));
  const updated = await updateOrderStatusRecord(sb, orderId, {
    status: 'cancelled_by_client',
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  await logOrderEvent(sb, {
    order_id: orderId,
    actor_user_id: authedUserId,
    actor_role: 'client',
    event_code: 'order.cancelled_by_client',
    from_status: order.status,
    to_status: updated.status,
  });
  return reply(req, res, 200, serializeOrderResponse(updated));
}

async function handlePhones(req, res, sb) {
  const url = new URL(req.url, 'http://localhost');
  const orderId = String(url.searchParams.get('order_id') || '').trim();
  const selfUserId = await getAuthedUserId(req, sb);
  if (!orderId || !selfUserId) return reply(req, res, 400, { ok: false, error: 'order_id va auth user kerak' });
  const order = await getOrderById(sb, orderId);
  if (!order) return reply(req, res, 404, { ok: false, error: 'Order topilmadi' });
  const otherId = String(order.client_id) === selfUserId ? order.driver_id : order.client_id;
  if (!otherId) return reply(req, res, 200, { ok: true, phone: null });
  const { data: profile } = await sb.from('profiles').select('phone,full_name,first_name,last_name').eq('id', otherId).maybeSingle();
  return reply(req, res, 200, { ok: true, phone: profile?.phone || null, other_user_id: otherId, profile: profile || null });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return reply(req, res, 204, { ok: true });
  try {
    const isPhonesRoute = String(req.routeKey || '').includes('order-phones') || /\/order\/phones(?:\?|$)/.test(String(req.url || ''));
    const { client, admin } = getClients(req);
    if (isPhonesRoute) return handlePhones(req, res, admin);
    if (req.method !== 'POST') return reply(req, res, 405, { ok: false, error: 'Method not allowed' });

    const body = await readBody(req);
    const action = String(body.action || '').toLowerCase();
    if (action === 'get') return handleGetOrder(req, res, admin, body);
    if (action === 'active') return handleActiveOrder(req, res, admin);
    if (action === 'cancel') return handleCancelOrder(req, res, admin, body);

    const authedUserId = await getAuthedUserId(req, admin);
    const clientId = authedUserId || String(body.client_id || '').trim() || null;
    const payload = buildUnifiedOrderPayload(body, clientId);
    if (!payload.client_id) return reply(req, res, 401, { ok: false, error: 'Auth user kerak' });
    const validationError = validateCreateOrderPayload(payload);
    if (validationError) return reply(req, res, 400, { ok: false, error: validationError });

    const idempotencyKey = buildCreateOrderIdempotencyKey(payload);
    const activeOrder = await getActiveOrderByClientId(admin, payload.client_id);
    if (
      activeOrder &&
      activeOrder.service_type === payload.service_type &&
      sameLocation(activeOrder.pickup, payload.pickup) &&
      sameLocation(activeOrder.dropoff, payload.dropoff)
    ) {
      return reply(req, res, 200, { ...serializeOrderResponse(activeOrder), idempotency_key: idempotencyKey, reused: true });
    }

    const data = await createOrderRecord(client, payload);
    await logOrderEvent(admin, {
      order_id: data.id,
      actor_user_id: payload.client_id,
      actor_role: 'client',
      event_code: 'order.created',
      to_status: data.status,
      payload: { service_type: data.service_type, idempotency_key: idempotencyKey },
    });
    return reply(req, res, 200, { ...serializeOrderResponse(data), idempotency_key: idempotencyKey });
  } catch (error) {
    return reply(req, res, 500, { ok: false, error: error?.message || 'Server error' });
  }
}
