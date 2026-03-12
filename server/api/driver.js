import { getRequestLang, translatePayload } from '../_shared/serverI18n.js';
import { getSupabaseAdmin, getAuthedUser } from '../_shared/supabase.js';

function reply(req, res, status, payload) {
  const lang = getRequestLang(req, payload && typeof payload === 'object' ? payload : null);
  return res.status(status).json(translatePayload(payload, lang));
}

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function normalizeDriverId(body = {}) { return body.driver_id || body.driverId || null; }


async function ensureDriverAccess(sb, userId) {
  const uid = String(userId || '').trim();
  if (!uid) throw new Error('driver_id_required');

  let { data: driver, error } = await sb
    .from('drivers')
    .select('user_id,is_verified,is_active,is_suspended')
    .eq('user_id', uid)
    .maybeSingle();
  if (error) throw error;
  if (driver) return driver;

  const { data: app, error: appError } = await sb
    .from('driver_applications')
    .select('id,user_id,status,transport_type,seat_count,requested_max_freight_weight_kg,requested_payload_volume_m3,vehicle_brand,vehicle_model,vehicle_year,vehicle_plate,vehicle_color')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (appError) throw appError;
  if (!app || app.status !== 'approved') {
    throw new Error('Driver row topilmadi. Avval tasdiqlangan driver bo\'lish kerak.');
  }

  const rpcResult = await sb.rpc('apply_driver_permissions', { p_user_id: uid }).catch(() => ({ error: null }));
  if (rpcResult?.error) {
    // fallback if rpc missing
    const allowed = app.transport_type === 'truck' ? ['freight'] : (app.transport_type === 'bus_gazel' ? ['delivery','inter_district','inter_city','freight'] : ['taxi','delivery','inter_district','inter_city','freight']);
    const insertPayload = {
      user_id: uid,
      application_id: app.id,
      transport_type: app.transport_type || 'light_car',
      allowed_services: allowed,
      seat_count: Number(app.seat_count || 0),
      max_freight_weight_kg: Number(app.requested_max_freight_weight_kg || 0),
      payload_volume_m3: Number(app.requested_payload_volume_m3 || 0),
      vehicle_brand: app.vehicle_brand || null,
      vehicle_model: app.vehicle_model || null,
      vehicle_year: app.vehicle_year || null,
      vehicle_plate: app.vehicle_plate || null,
      vehicle_color: app.vehicle_color || null,
      is_verified: true,
      is_active: true,
      is_suspended: false,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error: insertError } = await sb.from('drivers').upsert([insertPayload], { onConflict: 'user_id' });
    if (insertError) throw insertError;
  }

  const { data: ensured, error: ensuredError } = await sb
    .from('drivers')
    .select('user_id,is_verified,is_active,is_suspended')
    .eq('user_id', uid)
    .maybeSingle();
  if (ensuredError) throw ensuredError;
  if (!ensured) throw new Error('Driver row yaratilmadi');
  return ensured;
}
async function authUser(req, sb) {
  const h = req.headers?.authorization || req.headers?.Authorization || '';
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const { data } = await sb.auth.getUser(m[1].trim());
  return data?.user || null;
}

async function updatePresence(req, res, body = {}) {
  const sb = getSupabaseAdmin();
  const driverId = normalizeDriverId(body);
  if (!driverId) return reply(req, res, 400, { ok: false, error: 'Auth driver kerak' });
  const user = await getAuthedUser(req, sb);
  if (user && user.id !== driverId) return reply(req, res, 403, { ok: false, error: 'Token user mos emas' });

  await ensureDriverAccess(sb, driverId);

  const now = new Date().toISOString();
  const isOnline = !(body.is_online === false || body.isOnline === false || String(body.state || '').toLowerCase() === 'offline');
  const state = String(body.state || (isOnline ? 'online' : 'offline')).toLowerCase();
  const payload = {
    driver_id: driverId,
    is_online: isOnline,
    state,
    active_service_type: body.active_service_type ?? body.service_type ?? body.service ?? null,
    lat: num(body.lat),
    lng: num(body.lng),
    speed: num(body.speed),
    bearing: num(body.bearing ?? body.heading),
    device_id: body.device_id ?? null,
    platform: body.platform ?? null,
    app_version: body.app_version ?? null,
    updated_at: now,
    last_seen_at: now,
  };
  const { error } = await sb.from('driver_presence').upsert([payload], { onConflict: 'driver_id' });
  if (error) return reply(req, res, 500, { ok: false, error: error.message });
  return reply(req, res, 200, { ok: true, presence: payload });
}

export default async function driverHandler(req, res, routeKey) {
  try {
    if (req.method !== 'POST') return reply(req, res, 405, { ok: false, error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (['driver-location', 'driver-heartbeat', 'driver-state', 'driver'].includes(routeKey || 'driver')) {
      return updatePresence(req, res, body);
    }
    return reply(req, res, 404, { ok: false, error: 'Unknown driver route' });
  } catch (e) {
    return reply(req, res, 500, { ok: false, error: e?.message || 'Server error' });
  }
}
