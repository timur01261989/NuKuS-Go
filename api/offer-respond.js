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
    const driver_user_id = String(body.driver_user_id||'').trim();
    const action = String(body.action||'').trim();

    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!driver_user_id) return badRequest(res, 'driver_user_id kerak');
    if (!['accept','reject'].includes(action)) return badRequest(res, 'action accept|reject');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true });

    const sb = getSupabaseAdmin();
    const status = action === 'accept' ? 'accepted' : 'rejected';

    const { data: off, error: oe } = await sb.from('order_offers')
      .update({ status, responded_at: nowIso() })
      .eq('order_id', order_id)
      .eq('driver_user_id', driver_user_id)
      .select('*')
      .single();
    if (oe) throw oe;

    if (action === 'accept') {
      const { data: od, error: uerr } = await sb.from('orders')
        .update({ driver_user_id, status:'accepted', accepted_at: nowIso() })
        .eq('id', order_id)
        .select('id,status,driver_user_id')
        .single();
      if (uerr) throw uerr;
      return json(res, 200, { ok:true, offer: off, order: od });
    }

    return json(res, 200, { ok:true, offer: off });
  } catch (e) {
    return serverError(res, e);
  }
}
