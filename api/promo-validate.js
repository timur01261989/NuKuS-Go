import { json, badRequest, serverError } from './_lib.js';
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
    const code = String(b.code||'').trim().toUpperCase();
    const order_total_uzs = Number(b.order_total_uzs||0);
    if (!code) return badRequest(res, 'code kerak');
    if (!Number.isFinite(order_total_uzs) || order_total_uzs <= 0) return badRequest(res, 'order_total_uzs noto‘g‘ri');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, valid:false });

    const sb = getSupabaseAdmin();
    const { data: row, error } = await sb.from('promo_codes').select('*').eq('code', code).maybeSingle();
    if (error) throw error;
    if (!row || !row.is_active) return json(res, 200, { ok:true, valid:false });

    const now = new Date();
    if (row.starts_at && now < new Date(row.starts_at)) return json(res, 200, { ok:true, valid:false, reason:'not_started' });
    if (row.ends_at && now > new Date(row.ends_at)) return json(res, 200, { ok:true, valid:false, reason:'expired' });
    if (row.max_uses != null && Number(row.used_count||0) >= Number(row.max_uses)) return json(res, 200, { ok:true, valid:false, reason:'max_uses' });
    if (row.min_order_uzs != null && order_total_uzs < Number(row.min_order_uzs)) return json(res, 200, { ok:true, valid:false, reason:'min_order' });

    const discount_uzs = computeDiscount(row, order_total_uzs);
    return json(res, 200, { ok:true, valid:true, code, discount_uzs, kind: row.kind, value: row.value });
  } catch (e) { return serverError(res, e); }
}
