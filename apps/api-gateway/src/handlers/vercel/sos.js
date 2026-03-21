import { applyCors, json, badRequest, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';
import { triggerSOS } from '../_shared/safety/sosService.js';

export default async function handler(req, res) {
  if (applyCors(req, res, ['POST'])) return;
  if (req.method !== 'POST') return badRequest(res, 'method_not_allowed');

  try {
    const sb = getSupabaseAdmin();
    const userId = await getAuthedUserId(req, sb);
    if (!userId) return badRequest(res, 'unauthorized');

    const body = req.body || {};
    const alert = await triggerSOS({
      supabase: sb,
      userId,
      orderId: body.order_id ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      message: body.message ?? '',
    });

    return json(res, 200, { ok: true, alert });
  } catch (error) {
    return serverError(res, error);
  }
}
