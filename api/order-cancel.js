import { json, badRequest, serverError, nowIso } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});

    const order_id = String(body.order_id||'').trim();
    const cancelled_by = String(body.cancelled_by||'').trim();
    const cancel_reason = String(body.cancel_reason||'').trim();

    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!['client','driver'].includes(cancelled_by)) return badRequest(res, 'cancelled_by client|driver');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true });

    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('orders')
      .update({ status:'cancelled', cancelled_by, cancel_reason, cancelled_at: nowIso() })
      .eq('id', order_id)
      .select('id,status,cancelled_by,cancel_reason')
      .single();
    if (error) throw error;
    return json(res, 200, { ok:true, order: data });
  } catch (e) {
    return serverError(res, e);
  }
}
