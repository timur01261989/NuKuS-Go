import { json, badRequest, serverError, nowIso, hit } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';
function hasSupabaseEnv() {
  return !!(
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
  );
}
const ALLOWED = new Set(['offline','online','busy','on_trip','pause']);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const driver_user_id = String(body.driver_user_id||'').trim();
    const state = String(body.state||'').trim().toLowerCase();
    if (!driver_user_id) return badRequest(res, 'driver_user_id kerak');
    if (!ALLOWED.has(state)) return badRequest(res, 'state noto‘g‘ri');
    if (!hit(`ds:${driver_user_id}`, 800)) return json(res, 200, { ok:true, skipped:true });

    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, state });

    const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    const is_online = (state !== 'offline');
    const { data, error } = await sb.from('driver_presence').upsert([{ driver_user_id, is_online, updated_at: nowIso() }], { onConflict:'driver_user_id' }).select('*').single();
    if (error) throw error;
    return json(res, 200, { ok:true, presence: data, state });
  } catch (e) { return serverError(res, e); }
}
