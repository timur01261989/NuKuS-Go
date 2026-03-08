import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function register(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const user_id = String((await getAuthedUserId(req, getSupabaseAdmin())) || body.user_id || '').trim();
    const role = String(body.role || '').trim();
    const fcm_token = String(body.fcm_token || '').trim();
    if (!user_id) return badRequest(res, 'user_id required');
    if (!role) return badRequest(res, 'role required');
    if (!fcm_token) return badRequest(res, 'fcm_token required');

    if (!hasEnv()) return serverError(res, 'Missing SUPABASE env');
    const sb = getSupabaseAdmin();

    const row = {
      user_id,
      role,
      device_id: body.device_id ?? null,
      platform: body.platform ?? null,
      app_version: body.app_version ?? null,
      fcm_token,
      updated_at: nowIso(),
    };

    const { data, error } = await sb.from('push_tokens')
      .upsert([row], { onConflict: 'user_id,role,device_id' })
      .select('*').single();

    if (error) throw error;
    return json(res, 200, { ok:true, token: data });
  } catch (e) {
    return serverError(res, e?.message || String(e));
  }
}