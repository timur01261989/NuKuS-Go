import { json, badRequest, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.FCM_SERVER_KEY);
}

async function fcmSend({ serverKey, token, title, body, data }) {
  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `key=${serverKey}`,
    },
    body: JSON.stringify({
      to: token,
      priority: 'high',
      notification: { title, body },
      data: data || {},
    }),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out?.error || 'fcm_send_failed');
  return out;
}

/**
 * POST /api/push/send
 * body: { target_user_id?, user_id?, role, title, body, data? }
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body0 = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});

    const user_id = String(body0.target_user_id || body0.user_id || (await getAuthedUserId(req, getSupabaseAdmin())) || '').trim();
    const role = String(body0.role || '').trim();
    const title = String(body0.title || 'UniGo').trim();
    const body = String(body0.body || '').trim();

    if (!user_id) return badRequest(res, 'user_id required');
    if (!role) return badRequest(res, 'role required');
    if (!body) return badRequest(res, 'body required');

    if (!hasEnv()) return serverError(res, 'Missing env (SUPABASE + FCM_SERVER_KEY)');
    const sb = getSupabaseAdmin();

    const { data: tokens, error } = await sb.from('push_tokens')
      .select('fcm_token')
      .eq('user_id', user_id)
      .eq('role', role)
      .limit(20);

    if (error) throw error;
    const serverKey = process.env.FCM_SERVER_KEY;

    const results = [];
    for (const t of (tokens || [])) {
      if (!t?.fcm_token) continue;
      results.push(await fcmSend({ serverKey, token: t.fcm_token, title, body, data: body0.data || {} }));
    }

    return json(res, 200, { ok:true, sent: results.length });
  } catch (e) {
    return serverError(res, e?.message || String(e));
  }
}