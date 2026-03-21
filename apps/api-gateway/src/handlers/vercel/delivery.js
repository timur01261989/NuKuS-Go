import { json, serverError, badRequest } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';
import { processCancellationPipeline, processCompletionPipeline } from '../_shared/orders/orderCompletionPipeline.js';

const DELIVERY_ORDER_COLUMNS = [
  'id',
  'user_id',
  'driver_user_id',
  'created_by',
  'service_mode',
  'status',
  'parcel_type',
  'parcel_label',
  'weight_kg',
  'price',
  'price_uzs',
  'commission_amount',
  'payment_method',
  'comment',
  'note',
  'receiver_name',
  'receiver_phone',
  'sender_phone',
  'pickup_mode',
  'dropoff_mode',
  'pickup_region',
  'pickup_district',
  'pickup_label',
  'pickup_lat',
  'pickup_lng',
  'dropoff_region',
  'dropoff_district',
  'dropoff_label',
  'dropoff_lat',
  'dropoff_lng',
  'matched_trip_id',
  'matched_trip_title',
  'matched_driver_user_id',
  'matched_driver_name',
  'history',
  'created_at',
  'updated_at',
].join(',');

function nowIso() {
  return new Date().toISOString();
}

function normalizeOrder(input = {}, userId) {
  return {
    user_id: input.user_id || userId,
    driver_user_id: input.driver_user_id || null,
    created_by: input.created_by || userId,
    service_mode: input.service_mode || 'city',
    status: input.status || 'searching',
    parcel_type: input.parcel_type || 'document',
    parcel_label: input.parcel_label || 'Hujjat',
    weight_kg: Number(input.weight_kg || 0),
    price: Number(input.price || 0),
    price_uzs: Number(input.price_uzs ?? input.price ?? 0),
    commission_amount: Number(input.commission_amount || 0),
    payment_method: input.payment_method || 'cash',
    comment: input.comment || '',
    note: input.note || input.comment || '',
    receiver_name: input.receiver_name || '',
    receiver_phone: input.receiver_phone || '',
    sender_phone: input.sender_phone || '',
    pickup_mode: input.pickup_mode || 'precise',
    dropoff_mode: input.dropoff_mode || 'precise',
    pickup_region: input.pickup_region || '',
    pickup_district: input.pickup_district || '',
    pickup_label: input.pickup_label || '',
    pickup_lat: input.pickup_lat ?? null,
    pickup_lng: input.pickup_lng ?? null,
    dropoff_region: input.dropoff_region || '',
    dropoff_district: input.dropoff_district || '',
    dropoff_label: input.dropoff_label || '',
    dropoff_lat: input.dropoff_lat ?? null,
    dropoff_lng: input.dropoff_lng ?? null,
    matched_trip_id: input.matched_trip_id || null,
    matched_trip_title: input.matched_trip_title || '',
    matched_driver_user_id: input.matched_driver_user_id || null,
    matched_driver_name: input.matched_driver_name || '',
    history: Array.isArray(input.history) ? input.history : [],
    updated_at: nowIso(),
  };
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  try {
    const sb = getSupabaseAdmin();
    const body = await readBody(req);
    const action = String(body.action || '').trim();
    const authedUserId = await getAuthedUserId(req, sb);

    if (!authedUserId) return json(res, 401, { ok: false, error: 'Unauthorized' });
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

    if (action === 'list_my_orders') {
      const { data, error } = await sb
        .from('delivery_orders')
        .select(DELIVERY_ORDER_COLUMNS)
        .eq('user_id', authedUserId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return json(res, 200, { ok: true, orders: data || [] });
    }

    if (action === 'list_driver_orders') {
      const { data, error } = await sb
        .from('delivery_orders')
        .select(DELIVERY_ORDER_COLUMNS)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return json(res, 200, { ok: true, orders: data || [] });
    }

    if (action === 'create_order') {
      const row = normalizeOrder(body.payload || body.order || body, authedUserId);
      const { data, error } = await sb.from('delivery_orders').insert(row).select(DELIVERY_ORDER_COLUMNS).single();
      if (error) throw error;
      return json(res, 200, { ok: true, order: data });
    }

    if (action === 'update_order') {
      const orderId = String(body.id || body.order_id || '').trim();
      if (!orderId) return badRequest(res, 'id kerak');
      const patch = { ...(body.patch || {}), updated_at: nowIso() };
      const { data, error } = await sb
        .from('delivery_orders')
        .update(patch)
        .eq('id', orderId)
        .eq('user_id', authedUserId)
        .select(DELIVERY_ORDER_COLUMNS)
        .single();
      if (error) throw error;
      return json(res, 200, { ok: true, order: data });
    }

    if (action === 'delete_order') {
      const orderId = String(body.id || body.order_id || '').trim();
      if (!orderId) return badRequest(res, 'id kerak');
      const { error } = await sb.from('delivery_orders').delete().eq('id', orderId).eq('user_id', authedUserId);
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    if (action === 'driver_update_status') {
      const orderId = String(body.id || body.order_id || '').trim();
      const nextStatus = String(body.status || '').trim();
      if (!orderId || !nextStatus) return badRequest(res, 'id va status kerak');

      const { data: order, error: orderError } = await sb
        .from('delivery_orders')
        .select(DELIVERY_ORDER_COLUMNS)
        .eq('id', orderId)
        .single();
      if (orderError) throw orderError;

      const patch = { ...(body.patch || {}), status: nextStatus, updated_at: nowIso() };
      if (nextStatus === 'accepted') {
        patch.matched_driver_user_id = authedUserId;
        patch.driver_user_id = authedUserId;
        patch.matched_driver_name = body.driver_name || order.matched_driver_name || 'Haydovchi';
      }

      patch.history = Array.isArray(body.history)
        ? body.history
        : Array.isArray(order.history)
          ? order.history
          : [];

      let query = sb.from('delivery_orders').update(patch).eq('id', orderId);
      if (nextStatus === 'accepted') query = query.in('status', ['searching', 'pending']);
      const { data, error } = await query.select(DELIVERY_ORDER_COLUMNS).single();
      if (error) throw error;

      let pipeline = null;
      if (nextStatus === 'delivered') {
        pipeline = await processCompletionPipeline(sb, { sourceTable: 'delivery_orders', sourceId: orderId });
      }
      if (nextStatus === 'cancelled') {
        pipeline = await processCancellationPipeline(sb, { sourceTable: 'delivery_orders', sourceId: orderId });
      }

      return json(res, 200, { ok: true, order: data, pipeline });
    }

    return badRequest(res, 'Noma\'lum delivery action');
  } catch (error) {
    return serverError(res, error);
  }
}
