import { json, badRequest, serverError } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';
function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return json(res, 405, { ok:false, error:'Method not allowed' });
    const user_id = String(req.query?.user_id||'').trim();
    if (!user_id) return badRequest(res, 'user_id kerak');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, wallet:{ user_id, balance_uzs:0 } });

    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('wallets').select('user_id,balance_uzs,updated_at').eq('user_id', user_id).maybeSingle();
    if (error) throw error;
    return json(res, 200, { ok:true, wallet: data || { user_id, balance_uzs: 0 } });
  } catch (e) { return serverError(res, e); }
}
