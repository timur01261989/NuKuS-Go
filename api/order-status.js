import { json, badRequest, serverError, nowIso, store } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * POST /api/order-status
 * body: { order_id, status, driver_user_id? }
 * Updates orders.status (+ optional driver_user_id assignment)
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const order_id = String(body.order_id || '').trim();
    const status = String(body.status || '').trim();
    const driver_user_id = body.driver_user_id ? String(body.driver_user_id).trim() : null;

    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!status) return badRequest(res, 'status kerak');

    if (hasSupabaseEnv()) {
      const sb = getSupabaseAdmin();
      const patch = { status };
      if (driver_user_id) patch.driver_user_id = driver_user_id;
      // timestamps (optional)
      if (status === 'accepted') patch.accepted_at = nowIso();
      if (status === 'arrived') patch.arrived_at = nowIso();
      if (status === 'in_progress') patch.started_at = nowIso();
      if (status === 'completed') patch.completed_at = nowIso();
      if (status === 'cancelled') patch.cancelled_at = nowIso();

      const { data, error } = await sb
        .from('orders')
        .update(patch)
        .eq('id', order_id)
        .select('id,status,driver_user_id,created_at')
        .single();

      if (error) throw error;
      return json(res, 200, { ok:true, order: data });
    }

    // demo fallback
    const db = store();
    db.orders = db.orders || [];
    const idx = db.orders.findIndex(o => o.id === order_id);
    if (idx === -1) return badRequest(res, 'Order topilmadi');
    db.orders[idx] = { ...db.orders[idx], status, driver_user_id: driver_user_id || db.orders[idx].driver_user_id };
    return json(res, 200, { ok:true, order: db.orders[idx], demo:true });
  } catch (e) {
    return serverError(res, e);
  }
}
