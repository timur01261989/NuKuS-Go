import { json, serverError, nowIso } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * GET /api/cron-expire-orders?minutes=2
 * Marks 'searching' orders older than N minutes as 'expired'
 * Use with Vercel Cron or external scheduler.
 */
export default async function handler(req, res) {
  try {
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, expired:0 });
    const sb = getSupabaseAdmin();

    const minutes = Number(req.query?.minutes || 2);
    const cutoff = new Date(Date.now() - minutes*60*1000).toISOString();

    const { data, error } = await sb.from('orders')
      .update({ status: 'expired', cancelled_at: nowIso(), cancelled_by: 'system', cancel_reason: 'timeout' })
      .eq('status', 'searching')
      .lt('created_at', cutoff)
      .select('id');
    if (error) throw error;

    return json(res, 200, { ok:true, expired: (data||[]).length });
  } catch (e) {
    return serverError(res, e);
  }
}
