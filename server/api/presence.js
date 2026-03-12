import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY));
}


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
export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const sub = parts[1] || '';

    if (!hasSupabaseEnv()) return serverError(res, 'Server misconfigured: missing SUPABASE env');
    const sb = getSupabaseAdmin();

    if (req.method === 'POST' && (sub === 'heartbeat' || sub === 'ping' || sub === '')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const authedUserId = await getAuthedUserId(req, sb);
      const explicitDriverId = String(body.driver_id || '').trim();
      const driver_id = String(authedUserId || explicitDriverId || '').trim();
      if (!driver_id) return badRequest(res, 'Auth driver kerak');
      if (authedUserId && explicitDriverId && authedUserId !== explicitDriverId) return badRequest(res, 'driver_id token user_id bilan mos emas');

      const lat = body.lat === undefined ? null : Number(body.lat);
      const lng = body.lng === undefined ? null : Number(body.lng);
      const speed = body.speed === undefined ? null : Number(body.speed);
      const bearing = body.bearing === undefined ? (body.heading === undefined ? null : Number(body.heading)) : Number(body.bearing);
      const state = String(body.state || ((body.is_online === false || body.is_online === 'false') ? 'offline' : 'online'));
      const isOnline = !(body.is_online === false || body.is_online === 'false' || state === 'offline');
      const activeServiceType = body.active_service_type ?? body.activeServiceType ?? body.service_type ?? body.serviceType ?? body.service ?? null;
      const device_id = body.device_id ?? null;
      const platform = body.platform ?? null;
      const app_version = body.app_version ?? null;

      const payload = {
        driver_id,
        last_seen_at: nowIso(),
        is_online: isOnline,
        state,
        active_service_type: activeServiceType,
        updated_at: nowIso(),
      };
      if (Number.isFinite(lat)) payload.lat = lat;
      if (Number.isFinite(lng)) payload.lng = lng;
      if (Number.isFinite(speed)) payload.speed = speed;
      if (Number.isFinite(bearing)) payload.bearing = bearing;
      if (device_id) payload.device_id = String(device_id);
      if (platform) payload.platform = String(platform);
      if (app_version) payload.app_version = String(app_version);

      await ensureDriverAccess(sb, driver_id);

      let query = sb.from('driver_presence').upsert([payload], { onConflict: 'driver_id' });
      let { data, error } = await query
        .select('driver_id,last_seen_at,is_online,state,active_service_type,updated_at,lat,lng,speed,bearing,device_id,platform,app_version')
        .single();
      if (error && String(error.message || '').match(/speed|bearing|device_id|platform|app_version/i)) {
        const fb = { ...payload };
        delete fb.speed; delete fb.bearing; delete fb.device_id; delete fb.platform; delete fb.app_version;
        ({ data, error } = await sb.from('driver_presence')
          .upsert([fb], { onConflict: 'driver_id' })
          .select('driver_id,last_seen_at,is_online,state,active_service_type,updated_at,lat,lng')
          .single());
      }
      if (error) throw error;

      return json(res, 200, { ok: true, presence: data });
    }

    if (req.method === 'GET' && (sub === 'online' || sub === '')) {
      const seconds = Number(url.searchParams.get('seconds') || 60);
      const since = new Date(Date.now() - Math.max(5, seconds) * 1000).toISOString();
      const serviceType = url.searchParams.get('service_type') || url.searchParams.get('service') || url.searchParams.get('active_service_type') || '';

      let q = sb
        .from('driver_presence')
        .select('driver_id,last_seen_at,is_online,state,active_service_type,updated_at,lat,lng,speed,bearing,device_id,platform,app_version')
        .eq('is_online', true)
        .gte('last_seen_at', since);

      if (serviceType) q = q.eq('active_service_type', serviceType);

      let { data, error } = await q.limit(5000);
      if (error && String(error.message || '').match(/speed|bearing|device_id|platform|app_version/i)) {
        ({ data, error } = await sb
          .from('driver_presence')
          .select('driver_id,last_seen_at,is_online,state,active_service_type,updated_at,lat,lng')
          .eq('is_online', true)
          .gte('last_seen_at', since)
          .limit(5000));
      }
      if (error) throw error;

      return json(res, 200, { ok: true, online: data || [] });
    }

    return json(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (e) {
    return serverError(res, e?.message || String(e));
  }
}
