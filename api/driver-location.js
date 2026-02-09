import { json, badRequest, serverError, nowIso, store } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * POST /api/driver-location
 * body: { order_id, driver_user_id, lat, lng, bearing?, speed? }
 * Upsert into driver_locations (PK: order_id, driver_user_id)
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const order_id = String(body.order_id || '').trim();
    const driver_user_id = String(body.driver_user_id || '').trim();
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const bearing = body.bearing === undefined ? null : Number(body.bearing);
    const speed = body.speed === undefined ? null : Number(body.speed);

    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!driver_user_id) return badRequest(res, 'driver_user_id kerak');
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return badRequest(res, 'lat/lng noto‘g‘ri');

    if (hasSupabaseEnv()) {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from('driver_locations')
        .upsert([{
          order_id,
          driver_user_id,
          lat,
          lng,
          bearing,
          speed,
          updated_at: nowIso()
        }], { onConflict: 'order_id,driver_user_id' })
        .select('order_id,driver_user_id,lat,lng,bearing,speed,updated_at')
        .single();

      if (error) throw error;
      return json(res, 200, { ok:true, location: data });
    }

    // demo fallback (memory)
    const db = store();
    const key = `${order_id}:${driver_user_id}`;
    db.driver_locations = db.driver_locations || {};
    db.driver_locations[key] = { order_id, driver_user_id, lat, lng, bearing, speed, updated_at: nowIso() };
    return json(res, 200, { ok:true, location: db.driver_locations[key], demo:true });
  } catch (e) {
    return serverError(res, e);
  }
}
