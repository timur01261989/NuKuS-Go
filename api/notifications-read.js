import { json, badRequest, serverError } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';
function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const id = String(body.id||'').trim();
    const user_id = String(body.user_id||'').trim();
    if (!id) return badRequest(res, 'id kerak');
    if (!user_id) return badRequest(res, 'user_id kerak');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true });

    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('notifications').update({ is_read:true }).eq('id', id).eq('user_id', user_id).select('*').single();
    if (error) throw error;
    return json(res, 200, { ok:true, notification: data });
  } catch (e) { return serverError(res, e); }
}
