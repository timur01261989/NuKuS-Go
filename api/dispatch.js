import { json, badRequest, serverError, nowIso } from './_shared/cors.js';
import { getSupabaseAdmin } from './_shared/supabase.js';
import { haversineKm } from './_shared/geo.js';


function normalizeDriverId(body) {
  // Frontend historically sends driver_id; DB uses driver_id.
  return String(body.driver_id || body.driver_id || '').trim();
}


function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function logOrderEvent(sb, payload) {
  try {
    await sb.from('order_events').insert([{
      order_id: String(payload.order_id || ''),
      event: String(payload.event || ''),
      from_status: payload.from_status ?? null,
      to_status: payload.to_status ?? null,
      actor_role: payload.actor_role ?? null,
      actor_id: payload.actor_id ?? null,
      reason: payload.reason ?? null,
      created_at: nowIso(),
    }]);
  } catch (_) {
    // ignore event logging errors
  }
}

async function resolvePickup(sb, order_id, pickupFromBody) {
  if (pickupFromBody && Number.isFinite(Number(pickupFromBody.lat)) && Number.isFinite(Number(pickupFromBody.lng))) {
    return { lat: Number(pickupFromBody.lat), lng: Number(pickupFromBody.lng) };
  }
  if (!sb) return null;
  const { data: ord, error } = await sb.from('orders').select('pickup').eq('id', order_id).maybeSingle();
  if (error) throw error;
  const p = ord?.pickup;
  if (!p || !Number.isFinite(Number(p.lat)) || !Number.isFinite(Number(p.lng))) return null;
  return { lat: Number(p.lat), lng: Number(p.lng) };
}

/**
 * POST /api/dispatch
 * body: { action:"driver_ping", driver_id, lat, lng, bearing?, status? }
 * - Updates driver_presence (heartbeat)
 * - Returns { new_order } if there is a pending offer for this driver
 */
export async function driver_ping_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    const driver_id = normalizeDriverId(body);
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const bearing = body.bearing === undefined ? null : Number(body.bearing);
    const is_online = true;

    if (!driver_id) return badRequest(res, 'driver_id kerak');
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return badRequest(res, "lat/lng noto'g'ri");

    if (!hasSupabaseEnv()) {
      return serverError(res, "SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo'q");
    }

    const sb = getSupabaseAdmin();

    // update presence
    const { error: pe } = await sb
      .from('driver_presence')
      .upsert([{ driver_id, driver_id, is_online, lat, lng, bearing, updated_at: nowIso() }], { onConflict: 'driver_id' });
    if (pe) throw pe;

    // check for active offers
    const now = nowIso();
    const { data: offer, error: oe } = await sb
      .from('order_offers')
      .select('order_id,status,expires_at,sent_at')
      .or(`driver_id.eq.${driver_id},driver_id.eq.${driver_id}`)
      .eq('status', 'sent')
      .gt('expires_at', now)
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (oe) throw oe;

    if (!offer?.order_id) return json(res, 200, { ok: true });

    // fetch order details
    const { data: order, error: orr } = await sb.from('orders').select('*').eq('id', offer.order_id).maybeSingle();
    if (orr) throw orr;

    if (!order) return json(res, 200, { ok: true });

    return json(res, 200, { ok: true, new_order: order, offer });
  } catch (e) {
    return serverError(res, e);
  }
}

/**
 * POST /api/dispatch
 * body: { order_id, pickup?:{lat,lng}, radius_km? }
 * - If pickup missing, server reads orders.pickup
 */
export async function dispatch_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    // driver heartbeat/poll (used by DriverMap.jsx)
    if (body && body.action === 'driver_ping') {
      return await driver_ping_handler(req, res);
    }

    const order_id = String(body.order_id || '').trim();
    const radius_km = Number(body.radius_km || 5);

    if (!order_id) return badRequest(res, 'order_id kerak');

    if (!hasSupabaseEnv()) {
      return serverError(res, 'Server misconfigured: missing SUPABASE env');
    }

    const sb = getSupabaseAdmin();
    const pickup = await resolvePickup(sb, order_id, body.pickup);
    if (!pickup) return badRequest(res, 'pickup lat/lng kerak (body.pickup yoki orders.pickup)');

    // offer housekeeping: expire old offers
    const nowTs = nowIso();
    await sb.from('order_offers')
      .update({ status: 'expired', responded_at: nowTs })
      .eq('order_id', order_id)
      .eq('status', 'sent')
      .lte('expires_at', nowTs);

    await logOrderEvent(sb, { order_id, event: 'offer_expired', actor_role: 'system' });

    // if there is still an active offer, do not send a new one yet
    const { data: activeOffer, error: aoe } = await sb.from('order_offers')
      .select('driver_id,driver_id,expires_at')
      .eq('order_id', order_id)
      .eq('status', 'sent')
      .gt('expires_at', nowTs)
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (aoe) throw aoe;
    if (activeOffer?.driver_id || activeOffer?.driver_id) {
      return json(res, 200, { ok: true, offered: 0, active_offer: activeOffer });
    }

    // avoid re-offering to drivers who already got an offer recently
    const { data: already, error: ale } = await sb.from('order_offers')
      .select('driver_id,driver_id')
      .eq('order_id', order_id)
      .in('status', ['sent', 'rejected', 'expired', 'accepted'])
      .limit(5000);
    if (ale) throw ale;
    const alreadySet = new Set((already || []).map(r => r.driver_id || r.driver_id).filter(Boolean));

    // Fetch nearest approved, fresh online drivers from DB (scales to 10k+ online drivers)
    const exclude_driver_ids = Array.from(alreadySet).slice(0, 5000);
    const { data: candidates, error: ce } = await sb.rpc('find_nearby_drivers', {
      p_lat: pickup.lat,
      p_lng: pickup.lng,
      p_radius_km: radius_km,
      p_limit: 25,
      p_exclude_driver_ids: exclude_driver_ids,
    });
    if (ce) throw ce;

    const ranked = (candidates || [])
      .filter(d => d && d.driver_id)
      .slice(0, 1);

    const expires_at = new Date(Date.now() + 15 * 1000).toISOString();
    const rows = ranked.map((p) => ({ order_id, driver_id: p.driver_id, driver_id: p.driver_id, status: 'sent', sent_at: nowIso(), expires_at }));

    if (rows.length) {
      const { error: oe } = await sb.from('order_offers').upsert(rows, { onConflict: 'order_id,driver_id' });
      if (oe) throw oe;
      await logOrderEvent(sb, { order_id, event: 'offer_sent', actor_role: 'system', actor_id: String(rows[0]?.driver_id || '') });
    }

    return json(res, 200, { ok: true, offered: rows.length, drivers: ranked.map(r => ({ driver_id: r.driver_id, dist_km: r.dist_km })) });
  } catch (e) {
    return serverError(res, e);
  }
}

function score({ dist_km, rating_avg = 5, acceptance_rate = 1, completed_count = 0 }) {
  const dist = Math.min(50, dist_km);
  const r = 6 - Math.min(5, Math.max(1, rating_avg));
  const ar = 1 - Math.min(1, Math.max(0, acceptance_rate));
  const exp = 1 / Math.sqrt(1 + Math.min(2000, completed_count));
  return dist * 0.6 + r * 2.0 + ar * 5.0 + exp * 3.0;
}

/**
 * POST /api/dispatch/smart
 * body: { order_id, pickup?:{lat,lng}, radius_km? }
 */
export async function dispatch_smart_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const order_id = String(body.order_id || '').trim();
    const radius_km = Number(body.radius_km || 7);

    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!hasSupabaseEnv()) {
      return serverError(res, "SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo'q");
    }

    const sb = getSupabaseAdmin();
    const pickup = await resolvePickup(sb, order_id, body.pickup);
    if (!pickup) return badRequest(res, 'pickup lat/lng kerak (body.pickup yoki orders.pickup)');

    const nowTs = nowIso();
    await sb.from('order_offers')
      .update({ status: 'expired', responded_at: nowTs })
      .eq('order_id', order_id)
      .eq('status', 'sent')
      .lte('expires_at', nowTs);

    await logOrderEvent(sb, { order_id, event: 'offer_expired', actor_role: 'system' });

    const { data: activeOffer, error: aoe } = await sb.from('order_offers')
      .select('driver_id,driver_id,expires_at')
      .eq('order_id', order_id)
      .eq('status', 'sent')
      .gt('expires_at', nowTs)
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (aoe) throw aoe;
    if (activeOffer?.driver_id || activeOffer?.driver_id) {
      return json(res, 200, { ok: true, offered: 0, active_offer: activeOffer });
    }

    const { data: already, error: ale } = await sb.from('order_offers')
      .select('driver_id,driver_id')
      .eq('order_id', order_id)
      .in('status', ['sent', 'rejected', 'expired', 'accepted'])
      .limit(5000);
    if (ale) throw ale;
    const alreadySet = new Set((already || []).map(r => r.driver_id || r.driver_id).filter(Boolean));

    // Fetch nearest approved, fresh online drivers from DB (scales to 10k+ online drivers)
    const exclude_driver_ids = Array.from(alreadySet).slice(0, 5000);
    const { data: candidates, error: ce } = await sb.rpc('find_nearby_drivers', {
      p_lat: pickup.lat,
      p_lng: pickup.lng,
      p_radius_km: radius_km,
      p_limit: 25,
      p_exclude_driver_ids: exclude_driver_ids,
    });
    if (ce) throw ce;

    const ranked = (candidates || []).slice(0, 1);

    const expires_at = new Date(Date.now() + 15 * 1000).toISOString();(Date.now() + 15 * 1000).toISOString();
    const rows = ranked.map((p) => ({ order_id, driver_id: p.driver_id, driver_id: p.driver_id, status: 'sent', sent_at: nowIso(), expires_at }));
    if (rows.length) {
      const { error: oe } = await sb.from('order_offers').upsert(rows, { onConflict: 'order_id,driver_id' });
      if (oe) throw oe;
      await logOrderEvent(sb, { order_id, event: 'offer_sent', actor_role: 'system', actor_id: String(rows[0]?.driver_id || '') });
    }
    return json(res, 200, { ok: true, offered: rows.length, drivers: ranked.map(r => ({ driver_id: r.driver_id, dist_km: r.dist_km })) });
  } catch (e) {
    return serverError(res, e);
  }
}

/**
 * GET /api/dispatch/eta?distance_km=12.3&speed_kmh=30
 */
export async function eta_handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const distance_km = Number(url.searchParams.get('distance_km') || 0);
    const speed_kmh = Number(url.searchParams.get('speed_kmh') || 25);
    if (!Number.isFinite(distance_km) || distance_km < 0) return badRequest(res, "distance_km noto'g'ri");
    if (!Number.isFinite(speed_kmh) || speed_kmh <= 0) return badRequest(res, "speed_kmh noto'g'ri");

    const eta_seconds = Math.round((distance_km / speed_kmh) * 3600);
    return json(res, 200, { ok: true, eta_seconds, distance_km, speed_kmh });
  } catch (e) {
    return serverError(res, e);
  }
}

/**
 * GET /api/dispatch/traffic?lat=&lng=&base_eta_seconds=
 */
export async function traffic_eta_handler(req, res) {
  try {
    if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });

    const url = new URL(req.url, 'http://localhost');
    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    const base_eta_seconds = Number(url.searchParams.get('base_eta_seconds') || 0);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return badRequest(res, 'lat/lng kerak');
    if (!Number.isFinite(base_eta_seconds) || base_eta_seconds <= 0) return badRequest(res, "base_eta_seconds noto'g'ri");

    if (!hasSupabaseEnv()) {
      return serverError(res, "SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo'q");
    }

    const sb = getSupabaseAdmin();
    const { data: zones, error } = await sb.from('traffic_zones')
      .select('center_lat,center_lng,radius_km,multiplier')
      .eq('is_active', true)
      .limit(200);
    if (error) throw error;

    let mult = 1.0;
    for (const z of (zones || [])) {
      const d = haversineKm(lat, lng, Number(z.center_lat), Number(z.center_lng));
      if (d <= Number(z.radius_km || 0)) mult = Math.max(mult, Number(z.multiplier || 1));
    }
    return json(res, 200, { ok: true, provider: 'ZONES', multiplier: mult, eta_seconds: Math.round(base_eta_seconds * mult) });
  } catch (e) {
    return serverError(res, e);
  }
}

function cellId(lat, lng, size = 0.02) {
  const a = Math.floor(lat / size) * size;
  const b = Math.floor(lng / size) * size;
  return `${a.toFixed(2)}_${b.toFixed(2)}_${size}`;
}

/**
 * GET /api/dispatch/heatmap?minutes=60&cell=0.02
 */
export async function heatmap_handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const minutes = Number(url.searchParams.get('minutes') || 60);
    const cell = Number(url.searchParams.get('cell') || 0.02);

    if (!hasSupabaseEnv()) {
      return serverError(res, "SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo'q");
    }

    const sb = getSupabaseAdmin();
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const { data, error } = await sb.from('orders').select('id,created_at,pickup').gte('created_at', since).limit(5000);
    if (error) throw error;

    const map = new Map();
    for (const o of (data || [])) {
      const p = o.pickup;
      if (!p || p.lat == null || p.lng == null) continue;
      const cid = cellId(Number(p.lat), Number(p.lng), cell);
      map.set(cid, (map.get(cid) || 0) + 1);
    }
    const items = Array.from(map.entries()).map(([cell_id, demand_count]) => ({ cell_id, demand_count }))
      .sort((a, b) => b.demand_count - a.demand_count).slice(0, 400);
    return json(res, 200, { ok: true, minutes, cell, items });
  } catch (e) {
    return serverError(res, e);
  }
}

export default async function handler(req, res) {
  const rk = req.routeKey || '';
  switch (rk) {
    case 'dispatch':
      return await dispatch_handler(req, res);
    case 'dispatch-smart':
      return await dispatch_smart_handler(req, res);
    case 'eta':
      return await eta_handler(req, res);
    case 'traffic-eta':
      return await traffic_eta_handler(req, res);
    case 'heatmap':
      return await heatmap_handler(req, res);
    default:
      return await dispatch_handler(req, res);
  }
}
