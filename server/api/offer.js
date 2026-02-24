import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';

function normalizeDriverId(body) {
  return String(body.driver_id || body.driver_user_id || '').trim();
}


function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function logOrderEvent(sb, payload) {
  try {
    await sb.from('order_events').insert([{
      order_id: String(payload.order_id || ''),
      event: String(payload.event || ''),
      from_status: payload.from_status ?? null,
      to_status: payload.to_status ?? null,
      actor_role: payload.actor_role ?? null,
      actor_id: payload.actor_id ?? null,
      reason: payload.reason ?? null,
      created_at: nowIso(),
    }]);
  } catch (_) {
    // ignore event logging errors
  }
}

export async function offer_respond_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});

    const order_id = String(body.order_id||'').trim();
    const driver_id = normalizeDriverId(body);
    const driver_user_id = driver_id; // backward compatibility
    const action = String(body.action||'').trim();

    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!driver_user_id) return badRequest(res, 'driver_user_id kerak');
    if (!['accept','reject'].includes(action)) return badRequest(res, 'action accept|reject');
    if (!hasSupabaseEnv()) return serverError(res, 'SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo\'q');

    const sb = getSupabaseAdmin();
    const status = action === 'accept' ? 'accepted' : 'rejected';

    const { data: off, error: oe } = await sb.from('order_offers')
      .update({ status, responded_at: nowIso() })
      .eq('order_id', order_id)
      .or(`driver_id.eq.${driver_id},driver_user_id.eq.${driver_id}`)
      .select('*')
      .single();
    if (oe) throw oe;

    if (action === 'accept') {
      const { data: od, error: uerr } = await sb.from('orders')
        .update({ driver_id: driver_user_id, status:'accepted', accepted_at: nowIso() })
        .eq('id', order_id)
        .in('status', ['created','pending','searching','offered'])
        .is('driver_id', null)
        .select('id,status,driver_id')
        .maybeSingle();
      if (uerr) throw uerr;

      if (!od) {
        return json(res, 200, { ok:false, taken:true, offer: off });
      }

      await logOrderEvent(sb, {
        order_id,
        event: 'order_accepted',
        from_status: 'searching',
        to_status: 'accepted',
        actor_role: 'driver',
        actor_id: driver_user_id,
      });

      return json(res, 200, { ok:true, offer: off, order: od });
    }

    return json(res, 200, { ok:true, offer: off });
  } catch (e) {
    return serverError(res, e);
  }
}

/**
 * GET /api/offer-timeout
 * Marks order_offers where status='sent' and expires_at < now() as 'timeout'.
 * (Run from cron)
 */
export async function offer_timeout_handler(req, res) {
  try {
    if (!hasSupabaseEnv()) return serverError(res, 'SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo\'q');

    const sb = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data, error } = await sb.from('order_offers')
      .update({ status:'timeout', responded_at: nowIso() })
      .eq('status', 'sent')
      .lt('expires_at', now)
      .select('id');

    if (error) throw error;
    return json(res, 200, { ok:true, updated: (data||[]).length });
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
      const order_id = String(body.order_id||'').trim();
      const sender_user_id = String(body.sender_user_id||'').trim();
      const msg = String(body.body||'').trim();
      if (!order_id) return badRequest(res, 'order_id kerak');
      if (!sender_user_id) return badRequest(res, 'sender_user_id kerak');
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
    const user_id = String(body.user_id||'').trim();
    if (!id) return badRequest(res, 'id kerak');
    if (!user_id) return badRequest(res, 'user_id kerak');
    if (!hasSupabaseEnv()) return serverError(res, 'SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo\'q');

    const sb = getSupabaseAdmin();
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
    const user_id = String(body.user_id||'').trim();
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
