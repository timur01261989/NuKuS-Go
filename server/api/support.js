import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function pickQuery(req) {
  const url = new URL(req.url, 'http://localhost');
  const q = Object.fromEntries(url.searchParams.entries());
  return { ...q, ...(req.query || {}) };
}

export default async function handler(req, res) {
  try {
    if (!hasEnv()) return json(res, 200, { ok: false, error: 'Supabase env missing' });

    const sb = getSupabaseAdmin();
    const method = String(req.method || 'GET').toUpperCase();
    const path = String(req.url || '');
    const q = pickQuery(req);
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const action = String(q.action || body.action || '').trim().toLowerCase();
    const authedUserId = await getAuthedUserId(req, sb);

    if (method === 'POST' && (action === 'thread' || path.includes('/support/thread'))) {
      if (!authedUserId) return badRequest(res, 'Auth user kerak');
      const order_id = body.order_id ?? null;
      const user_id = authedUserId;
      const driver_id = body.related_driver_id ?? body.driver_id ?? null;

      let query = sb.from('support_threads').select('*').eq('status', 'open').eq('user_id', user_id).order('created_at', { ascending: false }).limit(1);
      if (order_id) query = query.eq('order_id', order_id);
      if (driver_id) query = query.eq('driver_id', driver_id);

      const { data: existing, error: fe } = await query;
      if (!fe && existing && existing.length > 0) {
        return json(res, 200, { ok: true, thread: existing[0], reused: true });
      }

      const title = order_id ? `Support order ${order_id}` : 'Support';
      const { data: created, error: ce } = await sb.from('support_threads').insert([{
        order_id,
        user_id,
        driver_id,
        title,
        status: 'open',
        created_at: nowIso(),
        updated_at: nowIso(),
      }]).select('*').single();

      if (ce) return json(res, 200, { ok: false, error: ce.message || String(ce) });
      return json(res, 200, { ok: true, thread: created, reused: false });
    }

    if (method === 'POST' && (action === 'message' || path.includes('/support/message'))) {
      const thread_id = String(body.thread_id || '').trim();
      const sender_role = String(body.sender_role || '').trim();
      const sender_id = authedUserId || null;
      const message = String(body.message || '').trim();
      if (!thread_id || !sender_role || !message) return badRequest(res, 'thread_id, sender_role, message required');
      if (!sender_id) return badRequest(res, 'Auth user kerak');

      const { data: msg, error: me } = await sb.from('support_messages').insert([{
        thread_id,
        sender_role,
        sender_id,
        sender_user_id: sender_id,
        message,
        body: message,
        created_at: nowIso(),
      }]).select('*').single();

      if (me) return json(res, 200, { ok: false, error: me.message || String(me) });
      try {
        await sb.from('support_threads').update({ updated_at: nowIso() }).eq('id', thread_id);
      } catch {}
      return json(res, 200, { ok: true, message: msg });
    }

    if (method === 'GET' && (action === 'thread' || path.includes('/support/thread'))) {
      const thread_id = String(q.thread_id || '').trim();
      if (!thread_id) return badRequest(res, 'thread_id required');

      const { data: th, error: te } = await sb.from('support_threads').select('*').eq('id', thread_id).maybeSingle();
      if (te) return json(res, 200, { ok: false, error: te.message || String(te) });
      if (authedUserId && th?.user_id && String(th.user_id) !== String(authedUserId)) {
        return json(res, 403, { ok: false, error: 'Forbidden' });
      }

      const { data: msgs, error: ge } = await sb.from('support_messages').select('*').eq('thread_id', thread_id).order('created_at', { ascending: true }).limit(100);
      if (ge) return json(res, 200, { ok: false, error: ge.message || String(ge) });

      return json(res, 200, { ok: true, thread: th, messages: msgs || [] });
    }

    if (method === 'GET' && (action === 'list' || path.includes('/support/list'))) {
      if (!authedUserId) return badRequest(res, 'Auth user kerak');
      let query = sb.from('support_threads').select('*').eq('user_id', authedUserId).order('updated_at', { ascending: false }).limit(50);
      if (q.order_id) query = query.eq('order_id', q.order_id);
      const { data, error } = await query;
      if (error) return json(res, 200, { ok: false, error: error.message || String(error) });
      return json(res, 200, { ok: true, threads: data || [] });
    }

    return json(res, 200, { ok: false, error: 'Unknown support action' });
  } catch (e) {
    return serverError(res, e);
  }
}
