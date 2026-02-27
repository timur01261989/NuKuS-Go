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


    // POST /api/presence/service
    // body: { driver_id, service_type, is_online }
    // Per-service online/offline (driver_service_presence)
    if (req.method === 'POST' && sub === 'service') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const driver_id = String(body.driver_id || '').trim();
      const service_type = String(body.service_type || '').trim();
      const is_online = !!body.is_online;

      if (!driver_id) return badRequest(res, 'driver_id required');
      if (!service_type) return badRequest(res, 'service_type required');

      const payload = {
        driver_id,
        service_type,
        is_online,
        last_seen_at: nowIso(),
        updated_at: nowIso(),
      };

      const { data, error } = await sb
        .from('driver_service_presence')
        .upsert([payload], { onConflict: 'driver_id,service_type' })
        .select('driver_id,service_type,is_online,last_seen_at,updated_at')
        .single();

      if (error) throw error;
      return json(res, 200, { ok: true, presence: data });
    }

    if (req.method === 'POST' && (sub === 'heartbeat' || sub === 'ping' || sub === '')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const driver_id = String(body.driver_id || body.driver_id || '').trim();
      if (!driver_id) return badRequest(res, 'driver_id required');

      const lat = body.lat === undefined ? null : Number(body.lat);
      const lng = body.lng === undefined ? null : Number(body.lng);
      const state = String(body.state || 'online');

      const payload = {
        driver_id,
        last_seen_at: nowIso(),
        is_online: true,
        state,
        updated_at: nowIso(),
      };
      if (Number.isFinite(lat)) payload.lat = lat;
      if (Number.isFinite(lng)) payload.lng = lng;

      const { data, error } = await sb
        .from('driver_presence')
        .upsert([payload], { onConflict: 'driver_id' })
        .select('driver_id,last_seen_at,is_online,state,updated_at,lat,lng')
        .single();
      // Optional: per-service presence refresh (if services[] is provided)
      const services = Array.isArray(body.services) ? body.services.map(s => String(s||'').trim()).filter(Boolean) : [];
      if (services.length) {
        const rows = services.map((st) => ({
          driver_id,
          service_type: st,
          is_online: true,
          last_seen_at: nowIso(),
          updated_at: nowIso(),
        }));
        const { error: se } = await sb
          .from('driver_service_presence')
          .upsert(rows, { onConflict: 'driver_id,service_type' });
        if (se) throw se;
      }

      if (error) throw error;

      return json(res, 200, { ok: true, presence: data });
    }

    if (req.method === 'GET' && (sub === 'online' || sub === '')) {
      const seconds = Number(url.searchParams.get('seconds') || 60);
      const since = new Date(Date.now() - Math.max(5, seconds) * 1000).toISOString();

      const { data, error } = await sb
        .from('driver_presence')
        .select('driver_id,last_seen_at,is_online,state,updated_at,lat,lng')
        .eq('is_online', true)
        .gte('last_seen_at', since)
        .limit(5000);
      if (error) throw error;

      return json(res, 200, { ok: true, online: data || [] });
    }

    return json(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (e) {
    return serverError(res, e?.message || String(e));
  }
}