import { json, badRequest, serverError, nowIso } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';
function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

function computeDiscount(row, orderTotal) {
  const kind = (row.kind || 'percent').toLowerCase();
  const val = Number(row.value||0);
  let d = 0;
  if (kind === 'fixed') d = val;
  else d = Math.round(orderTotal * (val/100));
  if (d < 0) d = 0;
  if (d > orderTotal) d = orderTotal;
  return d;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const order_id = String(b.order_id||'').trim();
    const user_id = String(b.user_id||'').trim();
    const code = String(b.code||'').trim().toUpperCase();
    const order_total_uzs = Number(b.order_total_uzs||0);
    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!user_id) return badRequest(res, 'user_id kerak');
    if (!code) return badRequest(res, 'code kerak');
    if (!Number.isFinite(order_total_uzs) || order_total_uzs <= 0) return badRequest(res, 'order_total_uzs noto‘g‘ri');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, applied:false });

    const sb = getSupabaseAdmin();
    const { data: row, error: pe } = await sb.from('promo_codes').select('*').eq('code', code).maybeSingle();
    if (pe) throw pe;
    if (!row || !row.is_active) return json(res, 200, { ok:true, applied:false, reason:'invalid' });

    const now = new Date();
    if (row.starts_at && now < new Date(row.starts_at)) return json(res, 200, { ok:true, applied:false, reason:'not_started' });
    if (row.ends_at && now > new Date(row.ends_at)) return json(res, 200, { ok:true, applied:false, reason:'expired' });
    if (row.max_uses != null && Number(row.used_count||0) >= Number(row.max_uses)) return json(res, 200, { ok:true, applied:false, reason:'max_uses' });
    if (row.min_order_uzs != null && order_total_uzs < Number(row.min_order_uzs)) return json(res, 200, { ok:true, applied:false, reason:'min_order' });

    const discount_uzs = computeDiscount(row, order_total_uzs);

    const { data: od, error: oe } = await sb.from('orders')
      .update({ promo_code: code, promo_discount_uzs: discount_uzs })
      .eq('id', order_id)
      .select('id,promo_code,promo_discount_uzs')
      .single();
    if (oe) throw oe;

    const { error: re } = await sb.from('promo_redemptions')
      .upsert([{ code, user_id, order_id, discount_uzs, created_at: nowIso() }], { onConflict: 'code,user_id,order_id' });
    if (re) throw re;

    await sb.from('promo_codes').update({ used_count: Number(row.used_count||0)+1 }).eq('code', code);
    return json(res, 200, { ok:true, applied:true, order: od, discount_uzs });
  } catch (e) { return serverError(res, e); }
}
