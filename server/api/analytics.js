import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * POST /api/analytics
 * body: { event, props }
 * Stores into order_events when order_id exists; otherwise into generic analytics_events.
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const event = String(body.event || '').trim();
    const props = body.props || {};
    if (!event) return badRequest(res, 'event required');

    if (!hasEnv()) return serverError(res, 'Missing SUPABASE env');
    const sb = getSupabaseAdmin();

    const order_id = props?.order_id ? String(props.order_id) : null;

    if (order_id) {
      await sb.from('order_events').insert([{
        order_id,
        event,
        meta: props,
        created_at: nowIso(),
      }]);
      return json(res, 200, { ok:true });
    }

    // generic events table (create if you want)
    await sb.from('analytics_events').insert([{
      event,
      props,
      created_at: nowIso(),
    }]);
    return json(res, 200, { ok:true });
  } catch (e) {
    return serverError(res, e?.message || String(e));
  }
}