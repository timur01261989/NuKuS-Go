import { getSupabaseAdmin } from '../_shared/supabase.js';

function json(res, status, payload) {
  return res.status(status).json(payload);
}

function safeNumber(v) {
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function normalizeDriverId(body = {}) {
  return (
    body.driver_id ||
    body.driverId ||
    body.user_id ||
    body.userId ||
    body.driver_user_id ||
    null
  );
}

/**
 * Optional auth check:
 * - If Authorization: Bearer <jwt> exists, verify user and ensure it matches driverId.
 * - If not present, allow (useful for local testing), but you should keep auth in production.
 */
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

async function handleDriverLocation(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const supabaseAdmin = getSupabaseAdmin();
  const body = req.body || {};

  const driverId = normalizeDriverId(body);
  if (!driverId) return json(res, 400, { error: 'driver_id kerak' });

  const authCheck = await enforceAuthIfPresent(req, driverId, supabaseAdmin);
  if (!authCheck.ok) return json(res, authCheck.status, { error: authCheck.error });

  const lat = safeNumber(body.lat);
  const lng = safeNumber(body.lng);
  const isOnline = body.is_online ?? body.isOnline ?? body.online ?? true;
  const activeServiceType = body.active_service_type ?? body.service_type ?? body.service ?? null;

  // Primary presence table (used for matching)
    const presencePayload = {
    driver_id: driverId,
    is_online: !!isOnline,
    updated_at: nowIso,
  };
  if (lat !== null) presencePayload.lat = lat;
  if (lng !== null) presencePayload.lng = lng;
  if (activeServiceType) presencePayload.active_service_type = String(activeServiceType);

  // Backwards-compatible upsert: if columns aren't migrated yet, retry without them.
  let presenceRes = await supabaseAdmin
    .from('driver_presence')
    .upsert(presencePayload, { onConflict: 'driver_id' });

  if (presenceRes.error && String(presenceRes.error.message || '').includes('active_service_type')) {
    const fb = { ...presencePayload };
    delete fb.active_service_type;
    presenceRes = await supabaseAdmin.from('driver_presence').upsert(fb, { onConflict: 'driver_id' });
  }
  if (presenceRes.error && (String(presenceRes.error.message || '').includes('lat') || String(presenceRes.error.message || '').includes('lng'))) {
    const fb2 = { driver_id: driverId, is_online: !!isOnline, updated_at: nowIso };
    presenceRes = await supabaseAdmin.from('driver_presence').upsert(fb2, { onConflict: 'driver_id' });
  }

  const presenceErr = presenceRes.error;

  if (presenceErr) {
    console.error('[driver-location] driver_presence upsert error:', presenceErr);
    return json(res, 500, { error: 'driver_presence yangilanmadi', details: presenceErr.message });
  }

  // Compatibility table used by some UI screens
  const { error: driversErr } = await supabaseAdmin
    .from('drivers')
    .upsert(
      {
        user_id: driverId,
        is_online: !!isOnline,
        lat,
        lng,
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (driversErr) {
    console.error('[driver-location] drivers upsert error:', driversErr);
    // don't fail hard; matching uses driver_presence
  }

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

  // Update last_seen + keep online true unless explicitly offlined
  const isOnline = body.is_online ?? body.isOnline ?? true;
  const activeServiceType = body.active_service_type ?? body.service_type ?? body.service ?? null;

  const { error: driversErr } = await supabaseAdmin
    .from('drivers')
    .upsert({ user_id: driverId, is_online: !!isOnline, last_seen_at: nowIso, updated_at: nowIso, active_service_type: activeServiceType }, { onConflict: 'user_id' });

  if (driversErr) {
    console.error('[driver-heartbeat] drivers upsert error:', driversErr);
  }

  const { error: presenceErr } = await supabaseAdmin
    .from('driver_presence')
    .upsert(
      { driver_id: driverId, is_online: !!isOnline, updated_at: nowIso },
      { onConflict: 'driver_id' }
    );

  if (presenceErr) {
    console.error('[driver-heartbeat] driver_presence upsert error:', presenceErr);
  }

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

  const isOnline = body.is_online ?? body.isOnline ?? body.online;
  const activeServiceType = body.active_service_type ?? body.service_type ?? body.service ?? null;
  if (typeof isOnline === 'undefined') return json(res, 400, { error: 'is_online kerak' });

  const nowIso = new Date().toISOString();

  const { error: driversErr } = await supabaseAdmin
    .from('drivers')
    .upsert({ user_id: driverId, is_online: !!isOnline, updated_at: nowIso, last_seen_at: nowIso, active_service_type: activeServiceType }, { onConflict: 'user_id' });

  if (driversErr) {
    console.error('[driver-state] drivers upsert error:', driversErr);
  }

  const { error: presenceErr } = await supabaseAdmin
    .from('driver_presence')
    .upsert(
      { driver_id: driverId, is_online: !!isOnline, updated_at: nowIso,
        active_service_type: activeServiceType
      }, { onConflict: 'driver_id' });

  if (presenceErr) {
    console.error('[driver-state] driver_presence upsert error:', presenceErr);
  }

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
