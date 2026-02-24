// api/driver.js
// Driver endpoints: location, state, heartbeat (presence)

import { getSupabaseAdmin } from '../_shared/supabase.js';
import { json, badRequest, serverError, nowIso, store, hit } from '../_shared/cors.js';

function normalizeDriverId(body) {
  return String(body.driver_id || body.driver_user_id || body.user_id || '').trim();
}


function hasSupabaseEnv() {
  return !!(
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
  );
}

/**
 * POST /api/driver/location  (or /api/driver-location)
 * body: { order_id, driver_user_id, lat, lng, bearing?, speed? }
 * Upsert into driver_locations (PK: order_id, driver_user_id)
 */
export async function driver_location_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const order_id = String(body.order_id || '').trim();
    const driver_id = normalizeDriverId(body);
    const driver_user_id = driver_id; // backward compatibility
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const bearing = body.bearing === undefined ? null : Number(body.bearing);
    const speed = body.speed === undefined ? null : Number(body.speed);

    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!driver_user_id) return badRequest(res, 'driver_user_id kerak');
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return badRequest(res, 'lat/lng noto‘g‘ri');

    // rate limit (location updates can flood DB)
    if (!hit(`loc:${driver_user_id}:${order_id}`, 1200)) return json(res, 200, { ok:true, skipped:true });

    if (hasSupabaseEnv()) {
      const sb = getSupabaseAdmin();
      
// tryDriverIdSchema: support both schemas without breaking existing behavior
try {
  // Preferred schema (your current DB): driver_locations(driver_id, lat, lng, speed_kmh, updated_at)
  const { data, error } = await sb
    .from('driver_locations')
    .upsert([{
      driver_id: driver_user_id,
      lat,
      lng,
      speed_kmh: speed,
      updated_at: nowIso()
    }], { onConflict: 'driver_id' })
    .select('driver_id,lat,lng,speed_kmh,updated_at')
    .single();
} catch (e) {
  // Fallback legacy schema: driver_locations(order_id, driver_user_id, ...)
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

/**
 * POST /api/driver/state  (or /api/driver-state)
 * body: { driver_id, driver_user_id, state: offline|online|busy|on_trip|pause }
 * Updates driver_presence.is_online (basic)
 */
const ALLOWED_STATE = new Set(['offline','online','busy','on_trip','pause']);
export async function driver_state_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const driver_id = normalizeDriverId(body);
    const driver_user_id = driver_id; // backward compatibility
    const state = String(body.state || '').trim().toLowerCase();

    if (!driver_user_id) return badRequest(res, 'driver_user_id kerak');
    if (!ALLOWED_STATE.has(state)) return badRequest(res, 'state noto‘g‘ri');

    // rate limit
    if (!hit(`ds:${driver_user_id}`, 800)) return json(res, 200, { ok:true, skipped:true });

    const is_online = state !== 'offline';

    if (hasSupabaseEnv()) {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from('driver_presence')
        .upsert([{
          driver_user_id,
          is_online,
          updated_at: nowIso()
        }], { onConflict: 'driver_id' })
        .select('*')
        .single();
      if (error) throw error;
      return json(res, 200, { ok:true, presence: data, state });
    }

    const db = store();
    db.driver_presence = db.driver_presence || {};
    db.driver_presence[driver_user_id] = { driver_id, driver_user_id, is_online, updated_at: nowIso() };
    return json(res, 200, { ok:true, presence: db.driver_presence[driver_user_id], state, demo:true });
  } catch (e) {
    return serverError(res, e);
  }
}

/**
 * POST /api/driver/heartbeat (or /api/driver-heartbeat)
 * body: { driver_id, driver_user_id, is_online, lat?, lng?, bearing? }
 * Updates driver_presence with location
 */
export async function driver_heartbeat_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const driver_id = normalizeDriverId(body);
    const driver_user_id = driver_id; // backward compatibility
    const is_online = body.is_online === undefined ? true : !!body.is_online;
    const lat = body.lat === undefined ? null : Number(body.lat);
    const lng = body.lng === undefined ? null : Number(body.lng);
    const bearing = body.bearing === undefined ? null : Number(body.bearing);

    if (!driver_user_id) return badRequest(res, 'driver_user_id kerak');

    // rate limit
    if (!hit(`hb:${driver_user_id}`, 900)) return json(res, 200, { ok:true, skipped:true });

    if (hasSupabaseEnv()) {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from('driver_presence')
        .upsert([{
          driver_user_id,
          is_online,
          lat,
          lng,
          bearing,
          updated_at: nowIso()
        }], { onConflict: 'driver_id' })
        .select('*')
        .single();
      if (error) throw error;
      return json(res, 200, { ok:true, presence: data });
    }

    const db = store();
    db.driver_presence = db.driver_presence || {};
    db.driver_presence[driver_user_id] = { driver_id, driver_user_id, is_online, lat, lng, bearing, updated_at: nowIso() };
    return json(res, 200, { ok:true, presence: db.driver_presence[driver_user_id], demo:true });
  } catch (e) {
    return serverError(res, e);
  }
}

export default async function driver(req, res, routeKey = 'driver') {
  // Support both /api/driver/<sub> and /api/driver-<sub>
  const url = new URL(req.url, 'http://localhost');
  const action = url.searchParams.get('action');

  switch (routeKey) {
    case 'driver-location':
      return await driver_location_handler(req, res);
    case 'driver-state':
      return await driver_state_handler(req, res);
    case 'driver-heartbeat':
      return await driver_heartbeat_handler(req, res);
    case 'driver':
    default: {
      // if /api/driver?action=...
      if (action === 'location') return await driver_location_handler(req, res);
      if (action === 'state') return await driver_state_handler(req, res);
      if (action === 'heartbeat') return await driver_heartbeat_handler(req, res);

      // infer by body
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        if ('order_id' in body && ('lat' in body || 'lng' in body)) return await driver_location_handler(req, res);
        if ('lat' in body || 'lng' in body) return await driver_heartbeat_handler(req, res);
        return await driver_state_handler(req, res);
      } catch {
        return await driver_state_handler(req, res);
      }
    }
  }
}
