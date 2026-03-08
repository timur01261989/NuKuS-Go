import { getRequestLang, translatePayload } from '../_shared/serverI18n.js'
// api/order.js  (Vercel Serverless Function for a Vite SPA)
// Creates an order in Supabase.
//
// ENV expected on Vercel (Project Settings -> Environment Variables):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (recommended for server-side insert)
// Optional fallbacks (if you already used these names):
//   SUPABASE_ANON_KEY
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//
// IMPORTANT: never expose SUPABASE_SERVICE_ROLE_KEY in client code.

import { createClient } from '@supabase/supabase-js'

function pickEnv(...names) {
  for (const n of names) {
    const v = process.env[n]
    if (v && String(v).trim().length > 0) return v
  }
  return ''
}

function setCors(res) {
  // Change * to your domain if you want to lock it down
  res.setHeader('Access-Control-Allow-Origin', '*')
  // Additive: allow GET for non-mutating subroutes (e.g., order/phones)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function safeJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  const lang = getRequestLang(res?.req, payload && typeof payload === 'object' ? payload : null)
  const translated = translatePayload(payload, lang)
  res.end(JSON.stringify(translated))
}

function nowIso() { return new Date().toISOString(); }

function envTrue(name, defaultVal = false) {
  const v = process.env[name];
  if (v == null || String(v).trim() === '') return defaultVal;
  const s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}

// Stage-3: Server pricing (safe, additive)
// - If enabled, server computes the final price using tariff_config + surge_config (if present)
// - If anything fails (missing tables/RLS), it falls back to the client-provided price
const DEFAULT_TARIFFS = {
  standard: { base: 5000, per_km: 1200, per_min: 200, min_fare: 8000 },
  comfort:  { base: 8000, per_km: 1600, per_min: 250, min_fare: 12000 },
  truck:    { base: 15000, per_km: 2500, per_min: 300, min_fare: 20000 },
};

function timeNowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function inTimeRange(current, from, to) {
  if (!from || !to) return false;
  if (from <= to) return current >= from && current <= to;
  return current >= from || current <= to;
}
function dayOfWeekNum() { return new Date().getDay(); }

async function safeGetTariffConfig(sb, pricingKey) {
  try {
    const { data } = await sb.from('tariff_config').select('*').eq('service_type', pricingKey).maybeSingle();
    if (data) return data;
  } catch (_) {
    // ignore (table may not exist)
  }
  return DEFAULT_TARIFFS[pricingKey] || DEFAULT_TARIFFS.standard;
}

async function safeCalcDemandRatio(sb) {
  try {
    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const [{ count: driverCount }, { count: orderCount }] = await Promise.all([
      sb.from('driver_presence').select('*', { count: 'exact', head: true }).eq('is_online', true).gte('updated_at', since),
      sb.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'searching'),
    ]);
    if (!driverCount || driverCount === 0) return 10;
    return (orderCount || 0) / driverCount;
  } catch (_) {
    return 1;
  }
}

async function safeCalcSurge(sb, pricingKey) {
  try {
    const { data: configs, error } = await sb
      .from('surge_config')
      .select('*')
      .eq('is_active', true)
      .or(`applies_to.eq.all,applies_to.eq.${pricingKey || 'standard'}`)
      .order('priority', { ascending: false });

    if (error || !configs?.length) return { multiplier: 1, reason: null };

    const now = timeNowHHMM();
    const today = dayOfWeekNum();
    const demandRatio = await safeCalcDemandRatio(sb);

    let bestMult = 1;
    let reason = null;

    for (const cfg of configs) {
      let match = false;
      if (cfg.rule_type === 'time') {
        const dayMatch = !cfg.days_of_week || cfg.days_of_week.includes(today);
        match = dayMatch && inTimeRange(now, cfg.time_from, cfg.time_to);
      } else if (cfg.rule_type === 'demand') {
        match = demandRatio >= Number(cfg.min_demand_ratio || 2);
      } else if (cfg.rule_type === 'manual') {
        match = true;
      }

      if (match) {
        const eff = Math.min(Number(cfg.multiplier || 1), Number(cfg.max_multiplier || 3));
        if (eff > bestMult) {
          bestMult = eff;
          reason = cfg.name;
        }
      }
    }

    return { multiplier: bestMult, reason };
  } catch (_) {
    return { multiplier: 1, reason: null };
  }
}

async function computeServerPrice(sb, pricingKey, distanceKm, durationMin) {
  try {
    const [tariff, surge] = await Promise.all([
      safeGetTariffConfig(sb, pricingKey),
      safeCalcSurge(sb, pricingKey),
    ]);

    const base = Number(tariff.base || 0) + Number(tariff.per_km || 0) * Number(distanceKm || 0) + Number(tariff.per_min || 0) * Number(durationMin || 0);
    const final = Math.max(Number(tariff.min_fare || 0), Math.round(base * Number(surge.multiplier || 1)));

    return {
      ok: true,
      price_uzs: final,
      base_price_uzs: Math.round(base),
      multiplier: Number(surge.multiplier || 1),
      surge_reason: surge.reason,
      pricing_key: pricingKey,
    };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

async function readBody(req) {
  // Vercel sometimes parses JSON automatically, but handle raw body too
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return { raw } }
}

// --- Subroute handler: order/phones ---
// Purpose: return the other party phone for direct PSTN dialing (numbers visible).
// Security: best-effort check that requester is part of the order.
async function handleOrderPhones(req, res, sb) {
  try {
    const method = String(req.method || 'GET').toUpperCase()
    const url = new URL(req.url, 'http://localhost')
    const qp = Object.fromEntries(url.searchParams.entries())
    const body = method === 'POST' ? await readBody(req) : {}

    const order_id = body.order_id ?? body.orderId ?? qp.order_id ?? qp.orderId
    const requester_id = body.requester_id ?? body.user_id ?? body.requesterId ?? qp.requester_id ?? qp.user_id

    if (!order_id || !requester_id) {
      return safeJson(res, 400, {
        code: 400,
        message: 'Missing required fields',
        details: 'order_id and requester_id are required'
      })
    }

    const ord = await sb.from('orders').select('id, client_id, driver_id, status').eq('id', order_id).maybeSingle()
    if (ord.error) {
      return safeJson(res, 500, { code: 500, message: ord.error.message })
    }
    const order = ord.data
    if (!order) {
      return safeJson(res, 404, { code: 404, message: 'Order not found' })
    }

    const rid = String(requester_id)
    const client_id = order.client_id ? String(order.client_id) : ''
    const driver_id = order.driver_id ? String(order.driver_id) : ''

    const requesterIsPassenger = client_id && rid === client_id
    const requesterIsDriver = driver_id && rid === driver_id
    if (!requesterIsPassenger && !requesterIsDriver) {
      return safeJson(res, 403, {
        code: 403,
        message: 'Forbidden',
        details: 'Requester is not a participant of this order'
      })
    }

    const otherId = requesterIsDriver ? client_id : driver_id
    if (!otherId) {
      return safeJson(res, 409, {
        code: 409,
        message: 'Other party not assigned yet',
        details: requesterIsDriver ? 'client_id missing' : 'driver_id missing'
      })
    }

    // Try profiles first
    let phone = null
    try {
      const p = await sb.from('profiles').select('phone_e164, phone').eq('id', otherId).maybeSingle()
      if (p?.data) phone = p.data.phone_e164 || p.data.phone || null
    } catch (_) {}

    // Fallback to drivers table variants (if driver isn't in profiles)
    if (!phone) {
      try {
        const d = await sb.from('drivers').select('phone_e164, phone, phone_number').eq('id', otherId).maybeSingle()
        if (d?.data) phone = d.data.phone_e164 || d.data.phone || d.data.phone_number || null
      } catch (_) {}
    }

    if (!phone) {
      return safeJson(res, 404, {
        code: 404,
        message: 'Phone not found',
        details: 'No phone field found for the other party'
      })
    }

    const payload = requesterIsDriver
      ? { passenger_phone: phone }
      : { driver_phone: phone }

    return safeJson(res, 200, { ok: true, order_id: order.id, ...payload })
  } catch (err) {
    return safeJson(res, 500, { code: 500, message: String(err?.message || err) })
  }
}

export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') return res.end()
  const routeKey = req.routeKey || ''
  const isPhonesRoute = routeKey === 'order-phones'
  if (!['POST', 'GET'].includes(String(req.method || '').toUpperCase())) {
    return safeJson(res, 405, { error: 'Method not allowed' })
  }
  if (!isPhonesRoute && String(req.method || '').toUpperCase() !== 'POST') {
    return safeJson(res, 405, { error: 'Method not allowed' })
  }

  const SUPABASE_URL = pickEnv('SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
  const SERVICE_ROLE = pickEnv('SUPABASE_SERVICE_ROLE_KEY')
  const ANON_KEY = pickEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (!SUPABASE_URL) {
    return safeJson(res, 500, {
      code: 500,
      message: 'Server misconfigured: SUPABASE_URL is missing',
      hint: 'Add SUPABASE_URL in Vercel Environment Variables'
    })
  }

  // Choose key:
  // - If client sent Authorization: Bearer <jwt>, use ANON_KEY and forward the header (RLS applies).
  // - Otherwise, use SERVICE_ROLE if available (bypasses RLS; server-only).
  const authHeader = req.headers.authorization || req.headers.Authorization || ''
  const useAnonWithAuth = Boolean(authHeader && authHeader.toLowerCase().startsWith('bearer '))
  const supabaseKey = useAnonWithAuth ? ANON_KEY : (SERVICE_ROLE || ANON_KEY)

  if (!supabaseKey) {
    return safeJson(res, 500, {
      code: 500,
      message: 'Server misconfigured: no Supabase key found',
      hint: 'Set SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY in Vercel'
    })
  }

  try {
    // --- Subroute: /api/order/phones ---
    if (isPhonesRoute) {
      const SUPABASE_URL = pickEnv('SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
      const SERVICE_ROLE = pickEnv('SUPABASE_SERVICE_ROLE_KEY')
      const ANON_KEY = pickEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')

      if (!SUPABASE_URL) {
        return safeJson(res, 500, {
          code: 500,
          message: 'Server misconfigured: SUPABASE_URL is missing',
        })
      }

      const authHeader = req.headers.authorization || req.headers.Authorization || ''
      const useAnonWithAuth = Boolean(authHeader && authHeader.toLowerCase().startsWith('bearer '))
      const supabaseKey = useAnonWithAuth ? ANON_KEY : (SERVICE_ROLE || ANON_KEY)
      if (!supabaseKey) {
        return safeJson(res, 500, {
          code: 500,
          message: 'Server misconfigured: no Supabase key found',
        })
      }

      const supabase = createClient(SUPABASE_URL, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: useAnonWithAuth ? { headers: { Authorization: authHeader } } : undefined
      })

      const supabaseAdmin = SERVICE_ROLE
        ? createClient(SUPABASE_URL, SERVICE_ROLE, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
          })
        : null

      return await handleOrderPhones(req, res, supabaseAdmin || supabase)
    }

    const body = await readBody(req)

    // Map fields from your client (keep both old/new names)
    const from_location = body.from_location ?? body.pickup ?? body.from ?? body.fromLocation ?? body.from_address ?? null
    const to_location = body.to_location ?? body.dropoff ?? body.to ?? body.toLocation ?? body.to_address ?? null
    const client_id = body.client_id ?? body.user_id ?? body.passengerId ?? null
    const clientPrice = Number(body.price_uzs ?? body.price ?? body.fare ?? 0) || 0
    const service_type = body.service_type ?? body.serviceType ?? body.service ?? 'taxi'
    const tariff_id = body.tariff_id ?? body.tariffId ?? null
    const distance_km = Number(body.distance_km ?? body.distanceKm ?? 0) || 0
    const duration_min = Number(body.duration_min ?? body.durationMin ?? (distance_km ? Math.max(1, Math.round(distance_km * 2)) : 0)) || 0

    const useServerPricing = Boolean(body.use_server_pricing === true) || envTrue('FEATURE_SERVER_PRICING', false)
    const pricingKey = String(body.pricing_service_type ?? body.pricingKey ?? tariff_id ?? 'standard')

    if (!from_location || !to_location) {
      return safeJson(res, 400, {
        code: 400,
        message: 'Missing required fields',
        details: 'from_location and to_location are required'
      })
    }

    const supabase = createClient(SUPABASE_URL, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: useAnonWithAuth ? { headers: { Authorization: authHeader } } : undefined
    })



// Admin client for dispatch (needs SERVICE ROLE). If missing, order still creates but no offers are generated.
const supabaseAdmin = SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })
  : null

async function logOrderEvent(sb, payload) {
  try {
    if (!sb) return;
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
    // ignore logging errors
  }
}

async function dispatchOrderToDrivers(orderRow) {
  if (!supabaseAdmin) return { skipped: true, reason: 'SERVICE_ROLE missing' }

  const svc = orderRow?.service_type || 'taxi'


  // Stage-5: Smart matching (feature-flagged). If enabled, try smart ranking first.
  // This keeps backward compatibility: on any error, falls back to legacy dispatch below.
  const smartEnabled = String(process.env.FEATURE_SMART_MATCHING || '').toLowerCase() === 'true';
  if (smartEnabled) {
    try {
      const smartRes = await dispatchOrderToDriversSmart(orderRow);
      if (smartRes && typeof smartRes.offers === 'number') return smartRes;
    } catch (_) {
      // ignore and fallback
    }
  }
  // Find online drivers that are active in this service.
  // NOTE: We intentionally keep this simple (no distance calc) to avoid column mismatch risks.
  const { data: drivers, error: dErr } = await supabaseAdmin
    .from('driver_presence')
    .select('driver_id,is_online,active_service_type,updated_at')
    .eq('is_online', true)
    .eq('active_service_type', svc)
    .order

// ============================================================
// Stage-5 helpers: Smart matching (real scoring)
// - Uses driver_presence (lat/lng) + order location (from_location.lat/lng)
// - Computes a score using distance + acceptance rate + completed count + avg rating
// - All queries are best-effort: if anything fails, it falls back to legacy dispatch.
// ============================================================

function haversineKmLocal(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function smartScore({ dist_km, rating_avg = 5, acceptance_rate = 1, completed_count = 0 }) {
  // Lower score is better
  const dist = Math.min(50, Number(dist_km || 0));
  const r = 6 - Math.min(5, Math.max(1, Number(rating_avg || 5)));
  const ar = 1 - Math.min(1, Math.max(0, Number(acceptance_rate || 1)));
  const exp = 1 / Math.sqrt(1 + Math.min(2000, Number(completed_count || 0)));
  return dist * 0.6 + r * 2.0 + ar * 5.0 + exp * 3.0;
}

async function fetchDriverStatsBatch(sb, driverIds) {
  const stats = new Map();
  for (const id of driverIds) {
    stats.set(String(id), { acceptance_rate: 1, completed_count: 0, rating_avg: 5 });
  }
  if (!sb || !driverIds?.length) return stats;

  const ids = driverIds.map(String).filter(Boolean);
  if (!ids.length) return stats;

  // Offers (acceptance rate) - last 7 days
  try {
    const sinceOffers = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: offers, error } = await sb
      .from('order_offers')
      .select('driver_id,status,sent_at')
      .in('driver_id', ids)
      .gte('sent_at', sinceOffers)
      .limit(5000);
    if (!error && Array.isArray(offers)) {
      const sent = new Map();
      const acc = new Map();
      for (const o of offers) {
        const did = String(o.driver_id || '');
        if (!did) continue;
        sent.set(did, (sent.get(did) || 0) + 1);
        if (o.status === 'accepted') acc.set(did, (acc.get(did) || 0) + 1);
      }
      for (const did of ids) {
        const s = sent.get(did) || 0;
        const a = acc.get(did) || 0;
        const rate = s > 0 ? a / s : 1;
        const prev = stats.get(did) || { acceptance_rate: 1, completed_count: 0, rating_avg: 5 };
        stats.set(did, { ...prev, acceptance_rate: rate });
      }
    }
  } catch (_) {
    // ignore
  }

  // Completed + rating - last 30 days
  try {
    const sinceTrips = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: trips, error } = await sb
      .from('orders')
      .select('driver_id,status,completed_at,rating')
      .in('driver_id', ids)
      .eq('status', 'completed')
      .gte('completed_at', sinceTrips)
      .limit(5000);
    if (!error && Array.isArray(trips)) {
      const cnt = new Map();
      const sum = new Map();
      const rcnt = new Map();
      for (const t of trips) {
        const did = String(t.driver_id || '');
        if (!did) continue;
        cnt.set(did, (cnt.get(did) || 0) + 1);
        const r = Number(t.rating);
        if (Number.isFinite(r) && r > 0) {
          sum.set(did, (sum.get(did) || 0) + r);
          rcnt.set(did, (rcnt.get(did) || 0) + 1);
        }
      }
      for (const did of ids) {
        const completed_count = cnt.get(did) || 0;
        const s = sum.get(did) || 0;
        const n = rcnt.get(did) || 0;
        const rating_avg = n > 0 ? (s / n) : 5;
        const prev = stats.get(did) || { acceptance_rate: 1, completed_count: 0, rating_avg: 5 };
        stats.set(did, { ...prev, completed_count, rating_avg });
      }
    }
  } catch (_) {
    // ignore
  }

  return stats;
}

async function dispatchOrderToDriversSmart(orderRow) {
  if (!supabaseAdmin) return { offers: 0, skipped: true, reason: 'SERVICE_ROLE missing' };

  const svc = orderRow?.service_type || 'taxi';

  const from = orderRow?.from_location || orderRow?.pickup || null;
  const lat0 = Number(from?.lat);
  const lng0 = Number(from?.lng);

  // If we don't have order pickup location, smart matching can't work; fallback handled by caller.
  if (!Number.isFinite(lat0) || !Number.isFinite(lng0)) return { offers: 0, skipped: true, reason: 'missing pickup lat/lng' };

  // Pull online drivers for this service with location
  const { data: drivers, error: dErr } = await supabaseAdmin
    .from('driver_presence')
    .select('driver_id,is_online,active_service_type,updated_at,lat,lng')
    .eq('is_online', true)
    .eq('active_service_type', svc)
    .order('updated_at', { ascending: false })
    .limit(120);

  if (dErr) return { offers: 0, error: dErr.message };

  const list = Array.isArray(drivers) ? drivers : [];
  if (!list.length) return { offers: 0 };

  // Compute distance for each driver (best-effort)
  const enriched = [];
  for (const d of list) {
    const lat = Number(d.lat);
    const lng = Number(d.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const dist_km = haversineKmLocal(lat0, lng0, lat, lng);
    enriched.push({ ...d, dist_km });
  }
  if (!enriched.length) return { offers: 0 };

  // Stats batch (acceptance/completed/rating)
  const ids = enriched.map(d => d.driver_id).filter(Boolean);
  const stats = await fetchDriverStatsBatch(supabaseAdmin, ids);

  // Rank by smart score
  const ranked = enriched
    .map(d => {
      const s = stats.get(String(d.driver_id)) || { acceptance_rate: 1, completed_count: 0, rating_avg: 5 };
      const sc = smartScore({ dist_km: d.dist_km, ...s });
      return { ...d, ...s, score: sc };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 1);

  if (!ranked.length) return { offers: 0 };

  const rows = ranked.map((d) => ({
    order_id: orderRow.id,
    driver_id: d.driver_id,
    status: 'sent',
    service_type: svc,
    // extra metadata (optional; ignored if columns don't exist)
    dist_km: d.dist_km,
    score: d.score,
  }));

  // Insert offers (legacy schema may not have dist_km/score columns; try then fallback)
  let ins = await supabaseAdmin.from('order_offers').insert(rows);
  if (ins.error) {
    const msg = String(ins.error.message || '').toLowerCase();
    if (msg.includes('dist_km') || msg.includes('score')) {
      const fallbackRows = rows.map(r => ({ order_id: r.order_id, driver_id: r.driver_id, status: r.status, service_type: r.service_type }));
      ins = await supabaseAdmin.from('order_offers').insert(fallbackRows);
    }
  }
  if (ins.error) return { offers: 0, error: ins.error.message };

  // Best-effort event log
  try {
    await supabaseAdmin.from('order_events').insert([{
      order_id: String(orderRow.id),
      event: 'offer_sent_smart',
      from_status: null,
      to_status: null,
      actor_role: 'system',
      actor_id: String(ranked[0]?.driver_id || ''),
      reason: null,
      created_at: nowIso(),
    }]);
  } catch (_) {}

  return { offers: rows.length, smart: true, picked: ranked.map(d => ({ driver_id: d.driver_id, dist_km: d.dist_km, score: d.score })) };
}
('updated_at', { ascending: false })
    .limit(80)

  if (dErr) return { offers: 0, error: dErr.message }

  const list = Array.isArray(drivers) ? drivers : []
  if (!list.length) return { offers: 0 }

  const rows = list.map((d) => ({
    order_id: orderRow.id,
    driver_id: d.driver_id,
    status: 'sent',
    service_type: svc
  }))

  const { error: oErr } = await supabaseAdmin.from('order_offers').insert(rows)
  if (oErr) return { offers: 0, error: oErr.message }

  return { offers: rows.length }
}

    // Stage-3: compute final price on server if enabled; otherwise keep client estimate.
    let finalPrice = clientPrice
    let pricingMeta = null
    if (useServerPricing) {
      const sbForPricing = supabaseAdmin || supabase
      const p = await computeServerPrice(sbForPricing, pricingKey, distance_km, duration_min)
      if (p?.ok && Number(p.price_uzs || 0) > 0) {
        finalPrice = Number(p.price_uzs)
        pricingMeta = p
      }
    }

    const insertPayload = {
      client_id,
      pickup: from_location,
      dropoff: to_location,
      price_uzs: finalPrice,
      status: body.status ?? 'searching',
      service_type,
      route_meta: { distance_km, duration_min },
      cargo_title: body.cargo_title ?? body.cargo_name ?? null,
      cargo_weight_kg: body.cargo_weight_kg ?? body.weight_kg ?? null,
      cargo_volume_m3: body.cargo_volume_m3 ?? body.volume_m3 ?? null,
      passenger_count: body.passenger_count ?? body.seat_count ?? 1,
      payment_method: body.payment_method ?? 'cash',
      note: body.note ?? null,
    }

    let data = null;
    let error = null;

    // Try insert with service_type + stage-3 extra fields. If DB isn't migrated yet, retry without unknown columns.
    let ins = await supabase
      .from('orders')
      .insert(insertPayload)
      .select()
      .single();

    data = ins.data;
    error = ins.error;

    if (error) {
      const msg = String(error.message || '').toLowerCase();
      const fallbackPayload = { ...insertPayload };

      // Remove columns that may not exist yet (safe progressive fallback)
      if (msg.includes('service_type')) delete fallbackPayload.service_type;
      if (msg.includes('route_meta')) delete fallbackPayload.route_meta;
      if (msg.includes('cargo_weight_kg')) delete fallbackPayload.cargo_weight_kg;
      if (msg.includes('cargo_volume_m3')) delete fallbackPayload.cargo_volume_m3;
      if (msg.includes('passenger_count')) delete fallbackPayload.passenger_count;
      if (msg.includes('payment_method')) delete fallbackPayload.payment_method;
      if (msg.includes('note')) delete fallbackPayload.note;

      // Retry once with reduced payload
      ins = await supabase
        .from('orders')
        .insert(fallbackPayload)
        .select()
        .single();

      data = ins.data;
      error = ins.error;
    }

    // Stage-1: observability. Log order creation without affecting main flow.
    await logOrderEvent(supabaseAdmin || supabase, {
      order_id: data?.id,
      event: 'order_created',
      from_status: null,
      to_status: data?.status ?? insertPayload.status ?? 'pending',
      actor_role: 'client',
      actor_id: client_id,
    });

    if (error) {
      return safeJson(res, 500, {
        code: 500,
        message: error.message,
        details: error.details || null,
        hint: error.code === '42501'
          ? 'RLS blocked insert. Either send Authorization header with a logged-in user + correct RLS policy, or use SUPABASE_SERVICE_ROLE_KEY on server.'
          : null
      })
    }

        // Fire-and-forget style (await to keep deterministic response content)
    const dispatchResult = await dispatchOrderToDrivers(data)

    // Additive: include pricing meta for debugging/UI (does not break existing clients)
    return safeJson(res, 200, { success: true, order: data, dispatch: dispatchResult, pricing: pricingMeta })
  } catch (err) {
    return safeJson(res, 500, {
      code: 500,
      message: 'A server error has occurred',
      details: String(err?.message || err)
    })
  }
}
