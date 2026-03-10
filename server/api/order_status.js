import { json, badRequest, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';
import { assertTransition } from '../_shared/orders/orderStatusMachine.js';
import { getOrderById, updateOrderStatusRecord, setDriverPresenceOnline } from '../_shared/orders/orderRepository.js';
import { serializeOrderResponse } from '../_shared/orders/orderSerializer.js';
import { logOrderEvent } from '../_shared/orders/orderEvents.js';

function nowIso() {
  return new Date().toISOString();
}

async function ensureWallet(sb, uid) {
  const { data } = await sb.from('wallets').select('user_id,balance_uzs').eq('user_id', uid).maybeSingle();
  if (data) return data;
  const { data: created, error } = await sb.from('wallets').insert([{ user_id: uid }]).select('user_id,balance_uzs').single();
  if (error) throw error;
  return created;
}

async function walletTx(sb, row) {
  const direction = row.direction || (['topup', 'order_payout', 'refund', 'bonus'].includes(row.kind) ? 'credit' : 'debit');
  const { error } = await sb.from('wallet_transactions').insert([
    {
      user_id: row.user_id,
      direction,
      kind: row.kind,
      service_type: row.service_type || null,
      amount_uzs: Math.abs(Number(row.amount_uzs || 0)),
      order_id: row.order_id || null,
      description: row.description || null,
      metadata: row.metadata || {},
      meta: row.metadata || {},
    },
  ]);
  if (error) throw error;
}

async function changeBalance(sb, userId, delta) {
  const wallet = await ensureWallet(sb, userId);
  const { error } = await sb
    .from('wallets')
    .update({ balance_uzs: Number(wallet.balance_uzs || 0) + Number(delta || 0), updated_at: nowIso() })
    .eq('user_id', userId);
  if (error) throw error;
}

function assertRolePermission(order, actorUserId, nextStatus) {
  const normalizedStatus = String(nextStatus || '').toLowerCase();
  const isClient = actorUserId && String(order.client_id || '') === String(actorUserId);
  const isDriver = actorUserId && String(order.driver_id || '') === String(actorUserId);

  if (normalizedStatus === 'cancelled_by_client') {
    if (!isClient) throw new Error('Faqat client o‘z orderini bekor qila oladi');
    return;
  }
  if (['accepted', 'arrived', 'in_progress', 'in_trip', 'completed', 'cancelled_by_driver'].includes(normalizedStatus)) {
    if (!isDriver) throw new Error('Faqat biriktirilgan driver statusni yangilay oladi');
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const sb = getSupabaseAdmin();
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const orderId = String(body.order_id || body.id || '').trim();
    const nextStatus = String(body.status || body.next_status || '').toLowerCase().trim();
    const actorUserId = (await getAuthedUserId(req, sb)) || body.actor_user_id || null;
    if (!orderId || !nextStatus) return badRequest(res, 'order_id va status kerak');

    const order = await getOrderById(sb, orderId);
    if (!order) return json(res, 404, { ok: false, error: 'Order topilmadi' });
    assertRolePermission(order, actorUserId, nextStatus);
    assertTransition(order.status, nextStatus);

    const patch = { status: nextStatus, updated_at: nowIso() };
    if (nextStatus === 'accepted') patch.accepted_at = nowIso();
    if (nextStatus === 'arrived') patch.arrived_at = nowIso();
    if (nextStatus === 'in_progress' || nextStatus === 'in_trip') patch.started_at = nowIso();
    if (nextStatus === 'completed') patch.completed_at = nowIso();
    if (nextStatus.startsWith('cancelled') || nextStatus === 'cancelled') patch.cancelled_at = nowIso();

    const updated = await updateOrderStatusRecord(sb, orderId, patch);

    if (nextStatus === 'completed' && updated.payment_method === 'wallet' && updated.client_id && updated.driver_id && Number(updated.price_uzs || 0) > 0) {
      const amount = Number(updated.price_uzs || 0);
      await ensureWallet(sb, updated.client_id);
      await ensureWallet(sb, updated.driver_id);
      await walletTx(sb, { user_id: updated.client_id, kind: 'order_payment', direction: 'debit', service_type: updated.service_type, amount_uzs: amount, order_id: orderId, description: 'Order payment', metadata: { order_id: orderId } });
      await changeBalance(sb, updated.client_id, -amount);
      await walletTx(sb, { user_id: updated.driver_id, kind: 'order_payout', direction: 'credit', service_type: updated.service_type, amount_uzs: amount, order_id: orderId, description: 'Order payout', metadata: { order_id: orderId } });
      await changeBalance(sb, updated.driver_id, amount);
      await setDriverPresenceOnline(sb, updated.driver_id);
    }

    await logOrderEvent(sb, {
      order_id: order.id,
      actor_user_id: actorUserId,
      actor_role: actorUserId === order.driver_id ? 'driver' : 'client',
      event_code: `order.${nextStatus}`,
      from_status: order.status,
      to_status: nextStatus,
      payload: {},
    });

    return json(res, 200, serializeOrderResponse(updated));
  } catch (error) {
    return serverError(res, error);
  }
}
