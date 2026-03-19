import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';
import { emitOrderEvent } from '../_shared/orders/orderEvents.js';
import { acceptOrderOffer, rejectOrderOffer, expireStaleOffers } from '../_shared/orders/orderOfferService.js';

function normalizeDriverId(body) {
  return String(body.driver_id || body.driverId || '').trim();
}

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function logOrderEvent(sb, payload) {
  try {
    await emitOrderEvent(sb, payload);
  } catch (_) {}
}

export async function offer_respond_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const order_id = String(body.order_id || body.orderId || '').trim();
    const explicitDriverId = normalizeDriverId(body);
    const action = String(body.action||'').trim();
    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!['accept','reject','decline'].includes(action)) return badRequest(res, 'action accept|reject');
    if (!hasSupabaseEnv()) return serverError(res, 'SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo\'q');

    const sb = getSupabaseAdmin();
    const authedUserId = await getAuthedUserId(req, sb);
    const driver_id = authedUserId || explicitDriverId;
    if (!driver_id) return badRequest(res, 'Auth driver kerak');
    if (authedUserId && explicitDriverId && authedUserId !== explicitDriverId) return json(res, 403, { ok:false, error:'driver_id token user_id bilan mos emas' });

    if (action === 'accept') {
      try {
        const accepted = await acceptOrderOffer(sb, { orderId: order_id, driverId: driver_id });
        return json(res, 200, { ok:true, order: accepted.order, offer: { order_id, driver_id, status: 'accepted' } });
      } catch (e) {
        return json(res, 200, { ok:false, taken:true, error: e?.message || 'offer_accept_failed' });
      }
    }

    const rejected = await rejectOrderOffer(sb, { orderId: order_id, driverId: driver_id, reason: action === 'decline' ? 'declined' : 'rejected' });
    return json(res, 200, { ok:true, offer: rejected.offer || { order_id, driver_id, status: 'rejected' } });
  } catch (e) {
    return serverError(res, e);
  }
}

export async function offer_timeout_handler(req, res) {
  try {
    if (!hasSupabaseEnv()) return serverError(res, 'SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo\'q');
    const sb = getSupabaseAdmin();
    const out = await expireStaleOffers(sb);
    return json(res, 200, { ok:true, updated: out.updated, offers: out.offers || [] });
  } catch (e) {
    return serverError(res, e);
  }
}

export async function messages_handler(req, res) {
  try {
    if (!hasSupabaseEnv()) return serverError(res, 'SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo\'q');
    const sb = getSupabaseAdmin();

    if (req.method === 'GET') {
      const order_id = String(req.query?.order_id||'').trim();
      if (!order_id) return badRequest(res, 'order_id kerak');
      const { data, error } = await sb.from('messages')
        .select('id,order_id,sender_user_id,body,created_at')
        .eq('order_id', order_id)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return json(res, 200, { ok:true, items: data || [] });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
      const order_id = String(body.order_id || body.orderId || '').trim();
      const authedUserId = await getAuthedUserId(req, sb);
      const sender_user_id = authedUserId || String(body.sender_user_id||'').trim();
      const msg = String(body.body||'').trim();
      if (!order_id) return badRequest(res, 'order_id kerak');
      if (!sender_user_id) return badRequest(res, 'Auth user kerak');
      if (!msg) return badRequest(res, 'body bo\'sh');

      const { data, error } = await sb.from('messages')
        .insert([{ order_id, sender_user_id, body: msg }])
        .select('id,order_id,sender_user_id,body,created_at')
        .single();
      if (error) throw error;
      return json(res, 201, { ok:true, message: data });
    }

    return json(res, 405, { ok:false, error:'Method not allowed' });
  } catch (e) {
    return serverError(res, e);
  }
}

export async function notifications_read_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const id = String(body.id||'').trim();
    if (!id) return badRequest(res, 'id kerak');
    if (!hasSupabaseEnv()) return serverError(res, 'SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo\'q');

    const sb = getSupabaseAdmin();
    const user_id = await getAuthedUserId(req, sb);
    if (!user_id) return badRequest(res, 'Auth user kerak');
    const { data, error } = await sb.from('notifications')
      .update({ is_read:true })
      .eq('id', id)
      .eq('user_id', user_id)
      .select('*')
      .single();
    if (error) throw error;
    return json(res, 200, { ok:true, notification: data });
  } catch (e) { return serverError(res, e); }
}

export async function notify_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const user_id = String(body.target_user_id || body.user_id || '').trim();
    if (!user_id) return badRequest(res, 'user_id kerak');
    if (!hasSupabaseEnv()) return serverError(res, 'SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo\'q');

    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('notifications').insert([{
      user_id,
      type: body.type || 'system',
      title: body.title || null,
      body: body.body || null,
      data: body.data || null,
    }]).select('*').single();
    if (error) throw error;
    return json(res, 201, { ok:true, notification: data });
  } catch (e) { return serverError(res, e); }
}

export default async function handler(req, res) {
  const rk = req.routeKey || (req.query && req.query.routeKey) || '';
  switch (rk) {
    case 'offer':
      return await offer_respond_handler(req, res);
    case 'offer-timeout':
      return await offer_timeout_handler(req, res);
    case 'messages':
      return await messages_handler(req, res);
    case 'notifications-read':
      return await notifications_read_handler(req, res);
    case 'notify':
      return await notify_handler(req, res);
    default:
      return await offer_respond_handler(req, res);
  }
}
