import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY));
}

/**
 * POST /api/presence/heartbeat
 * body: { driver_id, lat?, lng?, state? }
 * Updates driver_presence (driver_id PK) and keeps is_online true.
 *
 * GET /api/presence/online?seconds=60
 * Returns online drivers list (last_seen within threshold).
 */
export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const sub = parts[1] || '';

    if (!hasSupabaseEnv()) return serverError(res, 'Server misconfigured: missing SUPABASE env');
    const sb = getSupabaseAdmin();

    if (req.method === 'POST' && (sub === 'heartbeat' || sub === 'ping' || sub === '')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const driver_id = String(body.driver_id || body.driver_id || '').trim();
      const active_service_type = body.active_service_type ?? body.activeServiceType ?? body.service_type ?? body.serviceType ?? null;
      if (!driver_id) return badRequest(res, 'driver_id required');

      const lat = body.lat === undefined ? null : Number(body.lat);
      const lng = body.lng === undefined ? null : Number(body.lng);
      const state = String(body.state || 'online');
      const activeServiceType = body.active_service_type ?? body.service_type ?? body.service ?? null;

      const payload = {
        driver_id,
        last_seen_at: nowIso(),
        is_online: true,
        state,
        active_service_type: activeServiceType,
        updated_at: nowIso(),
      };
      if (Number.isFinite(lat)) payload.lat = lat;
      if (Number.isFinite(lng)) payload.lng = lng;

      const { data, error } = await sb
        .from('driver_presence')
        .upsert([payload], { onConflict: 'driver_id' })
        .select('driver_id,last_seen_at,is_online,state,active_service_type,updated_at,lat,lng')
        .single();
      if (error) throw error;

      return json(res, 200, { ok: true, presence: data });
    }

    if (req.method === 'GET' && (sub === 'online' || sub === '')) {
      const seconds = Number(url.searchParams.get('seconds') || 60);
      const since = new Date(Date.now() - Math.max(5, seconds) * 1000).toISOString();
      const serviceType = url.searchParams.get('service_type') || url.searchParams.get('service') || url.searchParams.get('active_service_type') || '';

      let q = sb
        .from('driver_presence')
        .select('driver_id,last_seen_at,is_online,state,active_service_type,updated_at,lat,lng')
        .eq('is_online', true)
        .gte('last_seen_at', since);

      if (serviceType) q = q.eq('active_service_type', serviceType);

      const { data, error } = await q.limit(5000);
      if (error) throw error;

      return json(res, 200, { ok: true, online: data || [] });
    }

    return json(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (e) {
    return serverError(res, e?.message || String(e));
  }
}