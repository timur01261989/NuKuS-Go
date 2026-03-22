import { json, badRequest, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';
import { processCancellationPipeline, processCompletionPipeline } from '../_shared/orders/orderCompletionPipeline.js';
import { ORDER_SELECT } from './order.shared.js';

function nowIso() { return new Date().toISOString(); }

const TRANSITIONS = {
  draft: ['searching', 'cancelled'],
  pending: ['searching', 'cancelled'],
  searching: ['offered', 'cancelled_by_client', 'expired'],
  offered: ['accepted', 'cancelled_by_client', 'expired'],
  accepted: ['arrived', 'in_progress', 'cancelled_by_driver', 'cancelled_by_client', 'completed'],
  arrived: ['in_progress', 'cancelled_by_driver', 'cancelled_by_client', 'completed'],
  in_progress: ['completed', 'cancelled_by_driver'],
  in_trip: ['completed', 'cancelled_by_driver'],
};

function canTransition(from, to) { return (TRANSITIONS[String(from || '').toLowerCase()] || []).includes(String(to || '').toLowerCase()); }

async function logEvent(sb, order, actorId, toStatus) {
  try {
    await sb.from('order_events').insert([{ order_id: order.id, actor_user_id: actorId || null, actor_role: actorId === order.driver_id ? 'driver' : 'client', event_code: `order.${toStatus}`, from_status: order.status, to_status: toStatus, payload: {} }]);
  } catch (_) {}
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const sb = getSupabaseAdmin();
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const order_id = String(body.order_id || body.id || '').trim();
    const next_status = String(body.status || body.next_status || '').toLowerCase().trim();
    const actor_user_id = (await getAuthedUserId(req, sb)) || body.actor_user_id || null;
    if (!order_id || !next_status) return badRequest(res, 'order_id va status kerak');

    const { data: order, error } = await sb.from('orders').select('*').eq('id', order_id).maybeSingle();
    if (error) throw error;
    if (!order) return json(res, 404, { ok: false, error: 'Order topilmadi' });
    if (!canTransition(order.status, next_status) && !(order.status === next_status)) {
      return json(res, 400, { ok: false, error: `Status transition ruxsat etilmagan: ${order.status} -> ${next_status}` });
    }

    const patch = { status: next_status, updated_at: nowIso() };
    if (next_status === 'accepted') patch.accepted_at = nowIso();
    if (next_status === 'arrived') patch.arrived_at = nowIso();
    if (next_status === 'in_progress' || next_status === 'in_trip') patch.started_at = nowIso();
    if (next_status === 'completed') patch.completed_at = nowIso();
    if (next_status.startsWith('cancelled') || next_status === 'cancelled') patch.cancelled_at = nowIso();

    const { data: updated, error: upErr } = await sb.from('orders').update(patch).eq('id', order_id).select(ORDER_SELECT).single();
    if (upErr) throw upErr;

    let pipeline = null;
    if (next_status === 'completed') {
      pipeline = await processCompletionPipeline(sb, { sourceTable: 'orders', sourceId: updated.id });
      if (updated.driver_id) {
        await sb.from('driver_presence').update({ state: 'online', current_order_id: null, updated_at: nowIso(), last_seen_at: nowIso() }).eq('driver_id', updated.driver_id);
      }
    }

    if (next_status.startsWith('cancelled') || next_status === 'cancelled') {
      pipeline = await processCancellationPipeline(sb, { sourceTable: 'orders', sourceId: updated.id });
      if (updated.driver_id) {
        await sb.from('driver_presence').update({ state: 'online', current_order_id: null, updated_at: nowIso(), last_seen_at: nowIso() }).eq('driver_id', updated.driver_id);
      }
    }

    await logEvent(sb, order, actor_user_id, next_status);
    return json(res, 200, { ok: true, order: updated, pipeline });
  } catch (e) {
    return serverError(res, e);
  }
}
