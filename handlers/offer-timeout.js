import { json, serverError, nowIso } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * GET /api/offer-timeout
 * Marks order_offers where status='sent' and expires_at < now() as 'timeout'.
 * (Run from cron)
 */
export default async function handler(req, res) {
  try {
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, updated:0 });

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
