// server/api/voip.js
// Stage infra: VOIP helper endpoints (SAFE / additive).
// This does NOT implement real VOIP; it only creates a log entry and returns a room_id placeholder.
//
// Endpoints:
// - POST /api/voip/start { order_id?, caller_role?, caller_id?, callee_role?, callee_id?, provider? } -> room_id
// - POST /api/voip/end   { log_id, ended_at?, duration_sec? } -> closes log
// - GET  /api/voip/log?order_id=... -> recent logs

import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function pickQuery(req) {
  const url = new URL(req.url, 'http://localhost');
  return { ...Object.fromEntries(url.searchParams.entries()), ...(req.query || {}) };
}

function makeRoomId() {
  return 'room_' + Math.random().toString(36).slice(2) + '_' + Date.now();
}

export default async function handler(req, res) {
  try {
    if (!hasEnv()) return json(res, { ok: false, error: 'Supabase env missing' }, 200);
    const sb = getSupabaseAdmin();
    const method = String(req.method || 'GET').toUpperCase();
    const path = String(req.url || '');
    const q = pickQuery(req);
    const body = req.body || {};

    const action = String(q.action || body.action || '').trim().toLowerCase();

    if (method === 'POST' && (action === 'start' || path.includes('/voip/start'))) {
      const room_id = makeRoomId();
      const payload = {
        order_id: body.order_id ?? null,
        caller_role: body.caller_role ?? null,
        caller_id: body.caller_id ?? null,
        callee_role: body.callee_role ?? null,
        callee_id: body.callee_id ?? null,
        provider: body.provider ?? null,
        room_id,
        started_at: nowIso(),
        meta: body.meta ?? null,
      };
      const { data, error } = await sb.from('voip_call_logs').insert([payload]).select('*').single();
      if (error) return json(res, { ok: false, error: error.message || String(error) }, 200);
      return json(res, { ok: true, room_id, log: data });
    }

    if (method === 'POST' && (action === 'end' || path.includes('/voip/end'))) {
      const log_id = String(body.log_id || '').trim();
      if (!log_id) return badRequest(res, 'log_id required');
      const upd = {
        ended_at: body.ended_at ?? nowIso(),
        duration_sec: body.duration_sec ?? null,
      };
      const { data, error } = await sb.from('voip_call_logs').update(upd).eq('id', log_id).select('*').single();
      if (error) return json(res, { ok: false, error: error.message || String(error) }, 200);
      return json(res, { ok: true, log: data });
    }

    if (method === 'GET' && (action === 'log' || path.includes('/voip/log'))) {
      let query = sb.from('voip_call_logs').select('*').order('started_at', { ascending: false }).limit(50);
      if (q.order_id) query = query.eq('order_id', q.order_id);
      const { data, error } = await query;
      if (error) return json(res, { ok: false, error: error.message || String(error) }, 200);
      return json(res, { ok: true, logs: data || [] });
    }

    return json(res, { ok: false, error: 'Unknown voip action' }, 200);
  } catch (e) {
    return serverError(res, e);
  }
}
