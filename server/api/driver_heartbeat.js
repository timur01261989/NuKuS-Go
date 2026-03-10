import { json, badRequest, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';
import { updateDriverHeartbeat } from '../_shared/drivers/driverHeartbeatService.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const sb = getSupabaseAdmin();
    const authedUserId = await getAuthedUserId(req, sb);
    const driverId = authedUserId || body.driver_id || body.driverId;
    if (!driverId) return badRequest(res, 'driver_id kerak');
    const out = await updateDriverHeartbeat({
      supabase: sb,
      driverId,
      lat: body.lat,
      lng: body.lng,
      heading: body.heading ?? body.bearing,
      speed: body.speed,
      serviceType: body.service_type || body.active_service_type || 'taxi',
    });
    return json(res, 200, out);
  } catch (e) {
    return serverError(res, e);
  }
}
