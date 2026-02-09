import { json, badRequest, serverError, nowIso } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';
function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const user_id = String(body.user_id||'').trim();
    const amount_uzs = Number(body.amount_uzs||0);
    if (!user_id) return badRequest(res, 'user_id kerak');
    if (!Number.isFinite(amount_uzs) || amount_uzs <= 0) return badRequest(res, 'amount_uzs noto‘g‘ri');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true });

    const sb = getSupabaseAdmin();
    const { data: cur } = await sb.from('wallets').select('balance_uzs').eq('user_id', user_id).maybeSingle();
    const nextBal = Number(cur?.balance_uzs||0) + Math.round(amount_uzs);

    const { error: we } = await sb.from('wallets').upsert([{ user_id, balance_uzs: nextBal, updated_at: nowIso() }], { onConflict:'user_id' });
    if (we) throw we;

    const { data: tx, error: te } = await sb.from('wallet_transactions').insert([{ user_id, amount_uzs: Math.round(amount_uzs), kind:'topup', meta:{ demo:true } }]).select('*').single();
    if (te) throw te;

    return json(res, 200, { ok:true, balance_uzs: nextBal, tx });
  } catch (e) { return serverError(res, e); }
}
