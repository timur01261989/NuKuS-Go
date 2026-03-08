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
  return body.driver_id || body.driverId || body.user_id || body.userId || body.driver_user_id || null;
}

async function enforceAuthIfPresent(req, driverId, supabaseAdmin) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader) return { ok: true };
  const m = String(authHeader).match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, status: 401, error: 'Authorization Bearer token topilmadi' };

  const token = m[1].trim();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, status: 401, error: 'Token noto‘g‘ri yoki eskirgan' };
  }
  if (driverId && data.user.id !== driverId) {
    return { ok: false, status: 403, error: 'driver_id token user_id bilan mos emas' };
  }
  return { ok: true, user: data.user };
}

async function upsertPresence(supabaseAdmin, payload) {
  let presenceRes = await supabaseAdmin.from('driver_presence').upsert(payload, { onConflict: 'driver_id' });
  if (presenceRes.error && String(presenceRes.error.message || '').match(/speed|bearing|device_id|platform|app_version/i)) {
    const fb = { ...payload };
    delete fb.speed; delete fb.bearing; delete fb.device_id; delete fb.platform; delete fb.app_version;
    presenceRes = await supabaseAdmin.from('driver_presence').upsert(fb, { onConflict: 'driver_id' });
  }
  if (presenceRes.error && String(presenceRes.error.message || '').includes('active_service_type')) {
    const fb = { ...payload };
    delete fb.active_service_type;
    presenceRes = await supabaseAdmin.from('driver_presence').upsert(fb, { onConflict: 'driver_id' });
  }
  if (presenceRes.error && (String(presenceRes.error.message || '').includes('lat') || String(presenceRes.error.message || '').includes('lng'))) {
    const fb = { driver_id: payload.driver_id, is_online: payload.is_online, updated_at: payload.updated_at, last_seen_at: payload.last_seen_at, state: payload.state };
    presenceRes = await supabaseAdmin.from('driver_presence').upsert(fb, { onConflict: 'driver_id' });
  }
  return presenceRes;
}

async function handleDriverLocation(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const supabaseAdmin = getSupabaseAdmin();
  const body = req.body || {};
  const nowIso = new Date().toISOString();

  const driverId = normalizeDriverId(body);
  if (!driverId) return json(res, 400, { error: 'driver_id kerak' });

  const authCheck = await enforceAuthIfPresent(req, driverId, supabaseAdmin);
  if (!authCheck.ok) return json(res, authCheck.status, { error: authCheck.error });

  const lat = safeNumber(body.lat);
  const lng = safeNumber(body.lng);
  const speed = safeNumber(body.speed);
  const bearing = safeNumber(body.bearing ?? body.heading);
  const isOnline = body.is_online ?? body.isOnline ?? body.online ?? true;
  const activeServiceType = body.active_service_type ?? body.service_type ?? body.service ?? null;

  const presencePayload = {
    driver_id: driverId,
    is_online: !!isOnline,
    updated_at: nowIso,
    last_seen_at: nowIso,
    state: !!isOnline ? 'online' : 'offline',
  };
  if (lat !== null) presencePayload.lat = lat;
  if (lng !== null) presencePayload.lng = lng;
  if (speed !== null) presencePayload.speed = speed;
  if (bearing !== null) presencePayload.bearing = bearing;
  if (activeServiceType) presencePayload.active_service_type = String(activeServiceType);
  if (body.device_id) presencePayload.device_id = String(body.device_id);
  if (body.platform) presencePayload.platform = String(body.platform);
  if (body.app_version) presencePayload.app_version = String(body.app_version);

  const presenceRes = await upsertPresence(supabaseAdmin, presencePayload);
  if (presenceRes.error) {
    console.error('[driver-location] driver_presence upsert error:', presenceRes.error);
    return json(res, 500, { error: 'driver_presence yangilanmadi', details: presenceRes.error.message });
  }

  const driverPayload = {
    user_id: driverId,
    is_online: !!isOnline,
    updated_at: nowIso,
    last_seen_at: nowIso,
  };
  if (lat !== null) driverPayload.lat = lat;
  if (lng !== null) driverPayload.lng = lng;
  if (activeServiceType) driverPayload.active_service_type = String(activeServiceType);
  const { error: driversErr } = await supabaseAdmin.from('drivers').upsert(driverPayload, { onConflict: 'user_id' });
  if (driversErr) console.error('[driver-location] drivers upsert error:', driversErr);

  return json(res, 200, { ok: true });
}

async function handleDriverHeartbeat(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const supabaseAdmin = getSupabaseAdmin();
  const body = req.body || {};
  const driverId = normalizeDriverId(body);
  if (!driverId) return json(res, 400, { error: 'driver_id kerak' });

  const authCheck = await enforceAuthIfPresent(req, driverId, supabaseAdmin);
  if (!authCheck.ok) return json(res, authCheck.status, { error: authCheck.error });

  const nowIso = new Date().toISOString();
  const isOnline = body.is_online ?? body.isOnline ?? true;
  const activeServiceType = body.active_service_type ?? body.service_type ?? body.service ?? null;
  const lat = safeNumber(body.lat);
  const lng = safeNumber(body.lng);
  const speed = safeNumber(body.speed);
  const bearing = safeNumber(body.bearing ?? body.heading);

  const { error: driversErr } = await supabaseAdmin.from('drivers').upsert({ user_id: driverId, is_online: !!isOnline, last_seen_at: nowIso, updated_at: nowIso, active_service_type: activeServiceType }, { onConflict: 'user_id' });
  if (driversErr) console.error('[driver-heartbeat] drivers upsert error:', driversErr);

  const presenceRes = await upsertPresence(supabaseAdmin, {
    driver_id: driverId,
    is_online: !!isOnline,
    last_seen_at: nowIso,
    updated_at: nowIso,
    state: !!isOnline ? 'online' : 'offline',
    active_service_type: activeServiceType,
    lat, lng, speed, bearing,
  });
  if (presenceRes.error) console.error('[driver-heartbeat] driver_presence upsert error:', presenceRes.error);

  return json(res, 200, { ok: true });
}

async function handleDriverState(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const supabaseAdmin = getSupabaseAdmin();
  const body = req.body || {};
  const driverId = normalizeDriverId(body);
  if (!driverId) return json(res, 400, { error: 'driver_id kerak' });

  const authCheck = await enforceAuthIfPresent(req, driverId, supabaseAdmin);
  if (!authCheck.ok) return json(res, authCheck.status, { error: authCheck.error });

  const isOnline = body.is_online ?? body.isOnline ?? body.online ?? (String(body.state || '').toLowerCase() !== 'offline');
  const activeServiceType = body.active_service_type ?? body.service_type ?? body.service ?? null;
  const nowIso = new Date().toISOString();

  const { error: driversErr } = await supabaseAdmin.from('drivers').upsert({ user_id: driverId, is_online: !!isOnline, updated_at: nowIso, last_seen_at: nowIso, active_service_type: activeServiceType }, { onConflict: 'user_id' });
  if (driversErr) console.error('[driver-state] drivers upsert error:', driversErr);

  const presenceRes = await upsertPresence(supabaseAdmin, {
    driver_id: driverId,
    is_online: !!isOnline,
    updated_at: nowIso,
    last_seen_at: nowIso,
    state: !!isOnline ? 'online' : 'offline',
    active_service_type: activeServiceType,
  });
  if (presenceRes.error) console.error('[driver-state] driver_presence upsert error:', presenceRes.error);

  return json(res, 200, { ok: true });
}

export default async function driverHandler(req, res, routeKey) {
  try {
    if (routeKey === 'driver-location') return await handleDriverLocation(req, res);
    if (routeKey === 'driver-heartbeat') return await handleDriverHeartbeat(req, res);
    if (routeKey === 'driver-state') return await handleDriverState(req, res);
    return json(res, 404, { error: 'Unknown driver route' });
  } catch (e) {
    console.error('[driver] fatal error:', e);
    return json(res, 500, { error: 'Server error', details: e?.message });
  }
}
