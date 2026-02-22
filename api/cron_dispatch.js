import { json, serverError } from './_shared/cors.js';
import { getSupabaseAdmin } from './_shared/supabase.js';
import { dispatch_handler } from './dispatch.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * GET /api/cron_dispatch
 * Vercel Cron entrypoint: periodically dispatches for searching orders so orders don't get stuck.
 *
 * Does NOT change business flow: it simply calls the existing dispatch_handler for active searching orders.
 */
export default async function handler(req, res) {
  try {
    if (!hasSupabaseEnv()) return serverError(res, 'Server misconfigured: missing SUPABASE env');
    const sb = getSupabaseAdmin();

    // Find searching orders (small batches)
    const { data: orders, error } = await sb
      .from('orders')
      .select('id,status')
      .eq('status', 'searching')
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) throw error;

    let dispatched = 0;
    for (const o of (orders || [])) {
      // Fake req/res to reuse existing handler safely
      const fakeReq = {
        method: 'POST',
        url: '/api/dispatch',
        body: JSON.stringify({ order_id: String(o.id) }),
      };
      const fakeRes = {
        statusCode: 200,
        _body: null,
        setHeader(){},
        end(chunk){ this._body = chunk; },
      };
      await dispatch_handler(fakeReq, fakeRes);
      dispatched += 1;
    }

    return json(res, 200, { ok: true, scanned: (orders||[]).length, dispatched });
  } catch (e) {
    return serverError(res, e?.message || String(e));
  }
}