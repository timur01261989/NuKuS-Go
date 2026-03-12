import { getRequestLang, translatePayload } from '../_shared/serverI18n.js';
import { getSupabaseAdmin, getAuthedUser } from '../_shared/supabase.js';

function reply(req, res, status, payload) {
  const lang = getRequestLang(req, payload && typeof payload === 'object' ? payload : null);
  return res.status(status).json(translatePayload(payload, lang));
}

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function normalizeDriverId(body = {}) { return body.driver_id || body.driverId || null; }


async function ensureDriverAccess(sb, userId) {
  return getApprovedDriverCore(sb, userId);
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
