// api/driver.js
// Combined driver: location + state (+ heartbeat)

import { getSupabaseAdmin } from './_shared/supabase.js';
import { json, badRequest, serverError, nowIso, hit } from './_shared/cors.js';
import { json, badRequest, serverError, nowIso, store } from './_shared/cors.js';
import { json, badRequest, serverError, nowIso, store, hit } from './_shared/cors.js';


function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * POST /api/driver-location
 * body: { order_id, driver_user_id, lat, lng, bearing?, speed? }
 * Upsert into driver_locations (PK: order_id, driver_user_id)
 */
export async function driver_location_handler(req, res) {
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


/* =========================
   ENV CHECK (NEW SUPABASE COMPATIBLE)
========================= */
function hasSupabaseEnv() {
  return !!(
    process.env.SUPABASE_URL &&
    (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY
    )
  );
}

/* =========================
   STATE ALLOWED
========================= */
const ALLOWED = new Set([
  'offline',
  'online',
  'busy',
  'on_trip',
  'pause'
]);

/* =========================
   HANDLER
========================= */
export async function driver_state_handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return json(res, 405, { ok: false, error: 'Method not allowed' });
    }

    const body = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});

    const driver_user_id = String(body.driver_user_id || '').trim();
    const state = String(body.state || '').trim().toLowerCase();

    if (!driver_user_id) {
      return badRequest(res, 'driver_user_id kerak');
    }

    if (!ALLOWED.has(state)) {
      return badRequest(res, 'state noto‘g‘ri');
    }

    /* =========================
       RATE LIMIT (prevent spam)
    ========================= */
    if (!hit(`ds:${driver_user_id}`, 800)) {
      return json(res, 200, { ok: true, skipped: true });
    }

    /* =========================
       DEMO MODE (no env)
    ========================= */
    if (!hasSupabaseEnv()) {
      console.warn("⚠️ Supabase ENV missing — demo mode");
      return json(res, 200, { ok: true, demo: true, state });
    }

    /* =========================
       CONNECT ADMIN
    ========================= */
    const sb = getSupabaseAdmin();

    const is_online = state !== 'offline';

    const { data, error } = await sb
      .from('driver_presence')
      .upsert(
        [{
          driver_user_id,
          is_online,
          updated_at: nowIso()
        }],
        { onConflict: 'driver_user_id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error("SUPABASE ERROR:", error);
      throw error;
    }

    return json(res, 200, {
      ok: true,
      presence: data,
      state
    });

  } catch (e) {
    console.error("DRIVER STATE ERROR:", e);
    return serverError(res, e);
  }
}


function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function driver_heartbeat_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});

    const driver_user_id = String(body.driver_user_id||'').trim();
    const is_online = !!body.is_online;
    const lat = body.lat === undefined ? null : Number(body.lat);
    const lng = body.lng === undefined ? null : Number(body.lng);
    const bearing = body.bearing === undefined ? null : Number(body.bearing);

    if (!driver_user_id) return badRequest(res, 'driver_user_id kerak');
    if (!hit(`hb:${driver_user_id}`, 900)) return json(res, 200, { ok:true, skipped:true });

    if (hasSupabaseEnv()) {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb.from('driver_presence').upsert([{
        driver_user_id, is_online, lat, lng, bearing, updated_at: nowIso()
      }], { onConflict: 'driver_user_id' }).select('*').single();
      if (error) throw error;
      return json(res, 200, { ok:true, presence: data });
    }

    const db = store();
    db.driver_presence = db.driver_presence || {};
    db.driver_presence[driver_user_id] = { driver_user_id, is_online, lat, lng, bearing, updated_at: nowIso() };
    return json(res, 200, { ok:true, presence: db.driver_presence[driver_user_id], demo:true });
  } catch (e) {
    return serverError(res, e);
  }
}

export default async function driver(req, res, routeKey = 'driver') {
  // Backward compatible route keys:
  // - driver-location
  // - driver-state
  // New consolidated key:
  // - driver (action via query/body)
  const url = new URL(req.url, 'http://localhost');
  const action = url.searchParams.get('action') || (typeof req.body === 'object' && req.body?.action) || (typeof req.body === 'string' ? (()=>{try{return JSON.parse(req.body||'{}').action}catch{return null}})() : null);

  switch (routeKey) {
    case 'driver-location':
      return await driver_location_handler(req, res);
    case 'driver-state':
      return await driver_state_handler(req, res);
    case 'driver':
    default:
      if (action === 'location') return await driver_location_handler(req, res);
      if (action === 'state' || action === 'heartbeat') return await driver_state_handler(req, res);
      // infer by body fields
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        if ('lat' in body || 'lng' in body) return await driver_location_handler(req, res);
        return await driver_state_handler(req, res);
      } catch {
        return await driver_state_handler(req, res);
      }
  }
}
