// server/api/support.js
// Stage infra: Order-linked support chat (SAFE / additive).
// Endpoints (single router):
// - POST /api/support/thread   { order_id?, user_id?, driver_id? } -> create/find open thread
// - POST /api/support/message  { thread_id, sender_role, sender_id?, message } -> insert message
// - GET  /api/support/thread?thread_id=... -> thread + last messages
// - GET  /api/support/list?order_id=...&user_id=...&driver_id=... -> threads (filtered)
//
// Notes:
// - Uses Supabase SERVICE_ROLE (bypasses RLS). If env missing, returns ok:false.
// - Best-effort: errors are returned but do not affect other features.

import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function pickQuery(req) {
  // Vercel router may pass query in req.query or in URL
  const url = new URL(req.url, 'http://localhost');
  const q = Object.fromEntries(url.searchParams.entries());
  return { ...q, ...(req.query || {}) };
}

export default async function handler(req, res) {
  try {
    if (!hasEnv()) return json(res, { ok: false, error: 'Supabase env missing' }, 200);

    const sb = getSupabaseAdmin();
    const method = String(req.method || 'GET').toUpperCase();
    const path = String(req.url || '');

    const q = pickQuery(req);
    const body = req.body || {};

    // Normalize action
    const action = String(q.action || body.action || '').trim().toLowerCase();

    if (method === 'POST' && (action === 'thread' || path.includes('/support/thread'))) {
      const order_id = body.order_id ?? null;
      const user_id = body.user_id ?? null;
      const driver_id = body.driver_id ?? null;

      // Try find an open thread for this order/user/driver (best-effort)
      let query = sb.from('support_threads').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(1);
      if (order_id) query = query.eq('order_id', order_id);
      if (user_id) query = query.eq('user_id', user_id);
      if (driver_id) query = query.eq('driver_id', driver_id);

      const { data: existing, error: fe } = await query;
      if (!fe && existing && existing.length > 0) {
        return json(res, { ok: true, thread: existing[0], reused: true });
      }

      const { data: created, error: ce } = await sb.from('support_threads').insert([{
        order_id,
        user_id,
        driver_id,
        status: 'open',
        created_at: nowIso(),
        updated_at: nowIso(),
      }]).select('*').single();

      if (ce) return json(res, { ok: false, error: ce.message || String(ce) }, 200);
      return json(res, { ok: true, thread: created, reused: false });
    }

    if (method === 'POST' && (action === 'message' || path.includes('/support/message'))) {
      const thread_id = String(body.thread_id || '').trim();
      const sender_role = String(body.sender_role || '').trim();
      const sender_id = body.sender_id ?? null;
      const message = String(body.message || '').trim();
      if (!thread_id || !sender_role || !message) return badRequest(res, 'thread_id, sender_role, message required');

      const { data: msg, error: me } = await sb.from('support_messages').insert([{
        thread_id,
        sender_role,
        sender_id,
        message,
        created_at: nowIso(),
      }]).select('*').single();

      if (me) return json(res, { ok: false, error: me.message || String(me) }, 200);

      // touch thread updated_at
      try {
        await sb.from('support_threads').update({ updated_at: nowIso() }).eq('id', thread_id);
      } catch {
        // ignore
      }

      return json(res, { ok: true, message: msg });
    }

    if (method === 'GET' && (action === 'thread' || path.includes('/support/thread'))) {
      const thread_id = String(q.thread_id || '').trim();
      if (!thread_id) return badRequest(res, 'thread_id required');

      const { data: th, error: te } = await sb.from('support_threads').select('*').eq('id', thread_id).maybeSingle();
      if (te) return json(res, { ok: false, error: te.message || String(te) }, 200);

      const { data: msgs, error: ge } = await sb.from('support_messages').select('*').eq('thread_id', thread_id).order('created_at', { ascending: true }).limit(100);
      if (ge) return json(res, { ok: false, error: ge.message || String(ge) }, 200);

      return json(res, { ok: true, thread: th, messages: msgs || [] });
    }

    if (method === 'GET' && (action === 'list' || path.includes('/support/list'))) {
      let query = sb.from('support_threads').select('*').order('updated_at', { ascending: false }).limit(50);
      if (q.order_id) query = query.eq('order_id', q.order_id);
      if (q.user_id) query = query.eq('user_id', q.user_id);
      if (q.driver_id) query = query.eq('driver_id', q.driver_id);

      const { data, error } = await query;
      if (error) return json(res, { ok: false, error: error.message || String(error) }, 200);
      return json(res, { ok: true, threads: data || [] });
    }

    return json(res, { ok: false, error: 'Unknown support action' }, 200);
  } catch (e) {
    return serverError(res, e);
  }
}
