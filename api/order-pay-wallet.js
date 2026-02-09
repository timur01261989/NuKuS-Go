import { json, badRequest, serverError, nowIso } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';
function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const order_id = String(b.order_id||'').trim();
    const user_id = String(b.user_id||'').trim();
    const amount_uzs = Math.round(Number(b.amount_uzs||0));
    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!user_id) return badRequest(res, 'user_id kerak');
    if (!Number.isFinite(amount_uzs) || amount_uzs <= 0) return badRequest(res, 'amount_uzs noto‘g‘ri');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, paid:false });

    const sb = getSupabaseAdmin();
    const { data: w, error: we } = await sb.from('wallets').select('balance_uzs').eq('user_id', user_id).maybeSingle();
    if (we) throw we;
    const bal = Number(w?.balance_uzs||0);
    if (bal < amount_uzs) return json(res, 200, { ok:true, paid:false, reason:'insufficient', balance_uzs: bal });

    const nextBal = bal - amount_uzs;
    const { error: up } = await sb.from('wallets').upsert([{ user_id, balance_uzs: nextBal, updated_at: nowIso() }], { onConflict:'user_id' });
    if (up) throw up;

    const { data: tx, error: te } = await sb.from('wallet_transactions').insert([{
      user_id, amount_uzs: -amount_uzs, kind:'payment', ref_order_id: order_id, meta:{ method:'wallet' }
    }]).select('*').single();
    if (te) throw te;

    const { data: od, error: oe } = await sb.from('orders')
      .update({ paid_with_wallet:true, final_price_uzs: amount_uzs })
      .eq('id', order_id)
      .select('id,paid_with_wallet,final_price_uzs')
      .single();
    if (oe) throw oe;

    return json(res, 200, { ok:true, paid:true, balance_uzs: nextBal, tx, order: od });
  } catch (e) { return serverError(res, e); }
}
