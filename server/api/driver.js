import { getRequestLang, translatePayload } from '../_shared/serverI18n.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';

function json(res, status, payload) {
  const lang = getRequestLang(res?.req, payload && typeof payload === 'object' ? payload : null);
  return res.status(status).json(translatePayload(payload, lang));
}

function safeNumber(v) {
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function normalizeDriverId(body = {}) {
  return body.driver_id || body.driverId || body.user_id || body.userId || null;
}

async function enforceAuthIfPresent(req, driverId, supabaseAdmin) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader) return { ok: true };
  const m = String(authHeader).match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, status: 401, error: 'Authorization Bearer token topilmadi' };
  const token = m[1].trim();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return { ok: false, status: 401, error: 'Token noto‘g‘ri yoki eskirgan' };
  if (driverId && data.user.id !== driverId) return { ok: false, status: 403, error: 'driver_id token user_id bilan mos emas' };
  return { ok: true, user: data.user };
}

async function upsertPresence(supabaseAdmin, payload) {
  return supabaseAdmin.from('driver_presence').upsert(payload, { onConflict: 'driver_id' });
}

async function ensureDriverCapabilityRow(supabaseAdmin, driverId) {
  const { data } = await supabaseAdmin.from('drivers').select('user_id').eq('user_id', driverId).maybeSingle();
  if (data) return;
  await supabaseAdmin.from('drivers').upsert({ user_id: driverId, transport_type: 'light_car', allowed_services: ['taxi'], is_verified: false }, { onConflict: 'user_id' });
}

async function updatePresence(req, res, body = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  const driverId = normalizeDriverId(body);
  if (!driverId) return json(res, 400, { error: 'driver_id kerak' });

  const authCheck = await enforceAuthIfPresent(req, driverId, supabaseAdmin);
  if (!authCheck.ok) return json(res, authCheck.status, { error: authCheck.error });

  const now = new Date().toISOString();
  const isOnline = !(body.is_online === false || body.isOnline === false || body.online === false || String(body.state || '').toLowerCase() === 'offline');
  const state = String(body.state || (isOnline ? 'online' : 'offline')).toLowerCase();
  const payload = {
    driver_id: driverId,
    is_online: isOnline,
    state,
    active_service_type: body.active_service_type ?? body.service_type ?? body.service ?? null,
    lat: safeNumber(body.lat),
    lng: safeNumber(body.lng),
    speed: safeNumber(body.speed),
    bearing: safeNumber(body.bearing ?? body.heading),
    device_id: body.device_id ?? null,
    platform: body.platform ?? null,
    app_version: body.app_version ?? null,
    updated_at: now,
    last_seen_at: now,
  };

  await ensureDriverCapabilityRow(supabaseAdmin, driverId);
  const { error } = await upsertPresence(supabaseAdmin, payload);
  if (error) {
    console.error('[driver] presence upsert error:', error);
    return json(res, 500, { error: 'driver_presence yangilanmadi', details: error.message });
  }

  return json(res, 200, { ok: true, driver_id: driverId, state, is_online: isOnline });
}

export default async function driverHandler(req, res, routeKey) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = req.body || {};
    if (routeKey === 'driver-location' || routeKey === 'driver-heartbeat' || routeKey === 'driver-state') {
      return await updatePresence(req, res, body);
    }
    return json(res, 404, { error: 'Unknown driver route' });
  } catch (e) {
    console.error('[driver] fatal error:', e);
    return json(res, 500, { error: 'Server error', details: e?.message });
  }
}
