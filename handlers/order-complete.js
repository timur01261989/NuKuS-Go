import { json, badRequest, serverError, nowIso } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';
function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

function cashbackRate(service_type){
  const st = String(service_type||'standard').toLowerCase();
  if (st === 'comfort') return 0.02;
  if (st === 'truck') return 0.0;
  return 0.01;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const order_id = String(b.order_id||'').trim();
    const client_user_id = String(b.client_user_id||'').trim();
    const driver_user_id = String(b.driver_user_id||'').trim();
    const final_price_uzs = Math.round(Number(b.final_price_uzs||0));
    const service_type = String(b.service_type||'standard');
    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!client_user_id) return badRequest(res, 'client_user_id kerak');
    if (!driver_user_id) return badRequest(res, 'driver_user_id kerak');
    if (!Number.isFinite(final_price_uzs) || final_price_uzs <= 0) return badRequest(res, 'final_price_uzs noto‘g‘ri');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true });

    const sb = getSupabaseAdmin();
    const rate = cashbackRate(service_type);
    const cashback_uzs = Math.round(final_price_uzs * rate);

    const { data: od, error: oe } = await sb.from('orders')
      .update({ status:'completed', completed_at: nowIso(), final_price_uzs: final_price_uzs, cashback_uzs })
      .eq('id', order_id)
      .select('id,status,final_price_uzs,cashback_uzs')
      .single();
    if (oe) throw oe;

    if (cashback_uzs > 0) {
      const { data: w } = await sb.from('wallets').select('balance_uzs').eq('user_id', client_user_id).maybeSingle();
      const bal = Number(w?.balance_uzs||0);
      const nextBal = bal + cashback_uzs;
      await sb.from('wallets').upsert([{ user_id: client_user_id, balance_uzs: nextBal, updated_at: nowIso() }], { onConflict:'user_id' });
      await sb.from('wallet_transactions').insert([{ user_id: client_user_id, amount_uzs: cashback_uzs, kind:'cashback', ref_order_id: order_id, meta:{ rate } }]);
    }

    const { data: st } = await sb.from('driver_stats').select('*').eq('driver_user_id', driver_user_id).maybeSingle();
    const completed_count = Number(st?.completed_count||0) + 1;
    await sb.from('driver_stats').upsert([{ driver_user_id, completed_count, updated_at: nowIso(), rating_avg: st?.rating_avg ?? 5.0, cancel_count: st?.cancel_count ?? 0, acceptance_rate: st?.acceptance_rate ?? 1.0 }], { onConflict:'driver_user_id' });

    return json(res, 200, { ok:true, order: od, cashback_uzs, rate });
  } catch (e) { return serverError(res, e); }
}
