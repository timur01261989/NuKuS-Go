import { createClient } from '@supabase/supabase-js';
import { getRequestLang, translatePayload } from '../_shared/serverI18n.js';

function pickEnv(...names) {
  for (const n of names) {
    const v = process.env[n];
    if (v && String(v).trim()) return String(v).trim();
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
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function getClients(req) {
  const url = pickEnv('SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
  const anon = pickEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const service = pickEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || (!anon && !service)) throw new Error('Missing Supabase env');
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const useAnonWithAuth = authHeader && /^Bearer\s+/i.test(String(authHeader));
  const client = createClient(url, useAnonWithAuth ? anon : (service || anon), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: useAnonWithAuth ? { headers: { Authorization: authHeader } } : undefined,
  });
  const admin = service ? createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : client;
  return { client, admin };
}

function normalizePoint(v) {
  if (!v) return null;
  if (typeof v === 'string') return { address: v };
  if (typeof v === 'object') {
    return {
      address: v.address || v.name || v.title || null,
      lat: Number.isFinite(Number(v.lat)) ? Number(v.lat) : null,
      lng: Number.isFinite(Number(v.lng)) ? Number(v.lng) : null,
      region: v.region || null,
      district: v.district || null,
      raw: v,
    };
  }
  return null;
}

function normalizeOrderPayload(body = {}) {
  const pickup = normalizePoint(body.pickup ?? body.from_location ?? body.from ?? body.fromLocation ?? body.from_address);
  const dropoff = normalizePoint(body.dropoff ?? body.to_location ?? body.to ?? body.toLocation ?? body.to_address);
  const service_type = String(body.service_type ?? body.serviceType ?? body.service ?? 'taxi').toLowerCase();
  const price_uzs = Math.max(0, Number(body.price_uzs ?? body.price ?? body.fare ?? 0) || 0);
  const passenger_count = Math.max(1, Number(body.passenger_count ?? body.seat_count ?? 1) || 1);
  const cargo_weight_kg = body.cargo_weight_kg ?? body.weight_kg ?? null;
  const cargo_volume_m3 = body.cargo_volume_m3 ?? body.volume_m3 ?? null;
  return {
    client_id: body.client_id ?? body.user_id ?? null,
    service_type,
    pickup,
    dropoff,
    status: String(body.status || 'searching').toLowerCase(),
    price_uzs,
    route_meta: {
      distance_km: Number(body.distance_km ?? body.distanceKm ?? 0) || 0,
      duration_min: Number(body.duration_min ?? body.durationMin ?? 0) || 0,
    },
    cargo_title: body.cargo_title ?? body.cargo_name ?? null,
    cargo_weight_kg: cargo_weight_kg == null ? null : Number(cargo_weight_kg),
    cargo_volume_m3: cargo_volume_m3 == null ? null : Number(cargo_volume_m3),
    passenger_count,
    payment_method: String(body.payment_method ?? body.pay_method ?? 'cash').toLowerCase(),
    note: body.note ?? null,
  };
}

async function logEvent(sb, payload) {
  try {
    await sb.from('order_events').insert([{ 
      order_id: payload.order_id,
      actor_user_id: payload.actor_user_id || null,
      actor_role: payload.actor_role || null,
      event_code: payload.event_code,
      reason: payload.reason || null,
      from_status: payload.from_status || null,
      to_status: payload.to_status || null,
      payload: payload.payload || {},
    }]);
  } catch (_) {}
}

async function handlePhones(req, res, sb) {
  const url = new URL(req.url, 'http://localhost');
  const orderId = String(url.searchParams.get('order_id') || '').trim();
  const selfUserId = String(url.searchParams.get('self_user_id') || '').trim();
  if (!orderId || !selfUserId) return reply(req, res, 400, { ok: false, error: 'order_id va self_user_id kerak' });
  const { data: order, error } = await sb.from('orders').select('id,client_id,driver_id').eq('id', orderId).maybeSingle();
  if (error) return reply(req, res, 500, { ok: false, error: error.message });
  if (!order) return reply(req, res, 404, { ok: false, error: 'Order topilmadi' });
  const otherId = String(order.client_id) === selfUserId ? order.driver_id : order.client_id;
  if (!otherId) return reply(req, res, 200, { ok: true, phone: null });
  let { data: profile } = await sb.from('profiles').select('phone,full_name,first_name,last_name').eq('id', otherId).maybeSingle();
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
    const payload = normalizeOrderPayload(body);
    if (!payload.client_id) return reply(req, res, 400, { ok: false, error: 'client_id kerak' });
    if (!payload.pickup || !payload.dropoff) return reply(req, res, 400, { ok: false, error: 'pickup va dropoff kerak' });
    if (payload.service_type === 'freight' && !(Number(payload.cargo_weight_kg) > 0)) {
      return reply(req, res, 400, { ok: false, error: 'Freight uchun cargo_weight_kg kerak' });
    }
    const { data, error } = await client.from('orders').insert([payload]).select('*').single();
    if (error) return reply(req, res, 500, { ok: false, error: error.message, details: error.details || null });
    await logEvent(admin, { order_id: data.id, actor_user_id: payload.client_id, actor_role: 'client', event_code: 'order.created', to_status: data.status, payload: { service_type: data.service_type } });
    return reply(req, res, 200, { ok: true, order: data });
  } catch (e) {
    return reply(req, res, 500, { ok: false, error: e?.message || 'Server error' });
  }
}
