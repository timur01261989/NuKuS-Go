import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';
import { getApprovedDriverCore } from '../_shared/drivers/driverCoreAccess.js';
import { createDriverPresenceRepository } from '../repositories/driverPresenceRepository.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY));
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const sub = parts[1] || '';

    if (!hasSupabaseEnv()) return serverError(res, 'Server misconfigured: missing SUPABASE env');
    const sb = getSupabaseAdmin();
    const presenceRepo = createDriverPresenceRepository(sb);

    if (req.method === 'POST' && (sub === 'heartbeat' || sub === 'ping' || sub === '')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const authedUserId = await getAuthedUserId(req, sb);
      const explicitDriverId = String(body.driver_id || '').trim();
      const driver_id = String(authedUserId || explicitDriverId || '').trim();
      if (!driver_id) return badRequest(res, 'Auth driver kerak');
      if (authedUserId && explicitDriverId && authedUserId !== explicitDriverId) {
        return badRequest(res, 'driver_id token user_id bilan mos emas');
      }

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
      const accuracy = body.accuracy === undefined ? null : Number(body.accuracy);

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
      if (Number.isFinite(accuracy)) payload.accuracy = accuracy;
      if (device_id) payload.device_id = String(device_id);
      if (platform) payload.platform = String(platform);
      if (app_version) payload.app_version = String(app_version);

      await getApprovedDriverCore(sb, driver_id);

      const data = await presenceRepo.upsertRow(payload);
      return json(res, 200, { ok: true, presence: data });
    }

    if (req.method === 'GET' && (sub === 'online' || sub === '')) {
      const seconds = Number(url.searchParams.get('seconds') || 120);
      const since = new Date(Date.now() - Math.max(10, seconds) * 1000).toISOString();
      const serviceType = url.searchParams.get('service_type') || url.searchParams.get('service') || url.searchParams.get('active_service_type') || '';
      const listLimit = Number(url.searchParams.get('limit') || 400);

      const qLat = Number(url.searchParams.get('lat'));
      const qLng = Number(url.searchParams.get('lng'));
      const radiusM = Number(url.searchParams.get('radius_m') || url.searchParams.get('radius') || 0);

      if (Number.isFinite(qLat) && Number.isFinite(qLng) && radiusM > 0) {
        const nearby = await presenceRepo.nearbyOnline({
          lat: qLat,
          lng: qLng,
          radiusM,
          sinceIso: since,
          serviceType: serviceType || null,
          limit: Math.min(Number(url.searchParams.get('limit') || 150), 500),
        });
        return json(res, 200, { ok: true, mode: 'nearby', online: nearby });
      }

      const online = await presenceRepo.listOnlineSince(since, {
        serviceType,
        limit: listLimit,
      });
      return json(res, 200, { ok: true, mode: 'list', online });
    }

    return json(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (e) {
    return serverError(res, e?.message || String(e));
  }
}
