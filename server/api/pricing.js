/**
 * api/pricing.js
 * AI Dinamik Narxlash - Admin boshqaruvchi surge_config jadvalidan o'qiydi
 *
 * GET /api/pricing?service_type=standard&distance_km=5&duration_min=10&lat=42.4&lng=59.6
 *     → { price_uzs, multiplier, surge_reason, breakdown }
 *
 * GET /api/pricing?action=surge_config
 *     → barcha surge qoidalari (admin ko'rish uchun)
 *
 * POST /api/pricing { action: "admin_update_surge", config_id, data: {...} }
 *      → admin surge qoidasini tahrirlash
 *
 * POST /api/pricing { action: "admin_create_surge", data: {...} }
 *      → admin yangi surge qoidasi yaratish
 *
 * POST /api/pricing { action: "admin_delete_surge", config_id }
 *      → admin surge qoidasini o'chirish
 *
 * POST /api/pricing { action: "admin_update_tariff", service_type, data: {...} }
 *      → admin tarif sozlamalarini yangilash (tariffs jadvalida)
 *
 * Surge hisoblash tartibi:
 *  1. Supabase surge_config jadvalidagi aktiv qoidalarni oladi
 *  2. Vaqt qoidalari: hozirgi HH:MM vaqt diapazonini tekshiradi
 *  3. Ob-havo qoidalari: agar OPENWEATHER_API_KEY bo'lsa, haqiqiy ob-havo tekshiradi
 *  4. Talab qoidalari: driver_presence / orders nisbatini hisoblaydi
 *  5. Eng yuqori multiplier'ni tanlaydi (max_multiplier ga qadar)
 *  6. Narxni hisoblaydi va qaytaradi
 */
import { json, badRequest, serverError } from "../_shared/cors.js";
import { getSupabaseAdmin, getAuthedUserId } from "../_shared/supabase.js";

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}"); } catch { return {}; }
}

function isAdminCheck(sb, userId) {
  return (async () => {
    const res = await sb.from("profiles").select("is_admin,role").eq("id", userId).maybeSingle();
    const roleVal = res.data?.role;
    const adminVal = res.data?.is_admin;
    return roleVal === "admin" || adminVal === true;
  })();
}

// ─── Vaqt oralig'ini tekshirish ───────────────────────────────────────────────
function timeNowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function inTimeRange(current, from, to) {
  if (!from || !to) return false;
  if (from <= to) return current >= from && current <= to;
  return current >= from || current <= to; // tungi shift (22:00 - 06:00)
}
function dayOfWeekNum() {
  // 0=Yak, 1=Du ... 6=Sha
  return new Date().getDay();
}

// ─── Ob-havo kodi tekshirish ──────────────────────────────────────────────────
async function fetchWeatherCode(lat, lng) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key || !lat || !lng) return null;
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.weather?.[0]?.id || null; // OpenWeather condition code
  } catch { return null; }
}

// ─── Talab nisbatini hisoblash ────────────────────────────────────────────────
async function calcDemandRatio(sb) {
  try {
    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const [{ count: driverCount }, { count: orderCount }] = await Promise.all([
      sb.from("driver_presence").select("*", { count: "exact", head: true }).eq("is_online", true).gte("updated_at", since),
      sb.from("orders").select("*", { count: "exact", head: true }).eq("status", "searching"),
    ]);
    if (!driverCount || driverCount === 0) return 10; // haydovchi yo'q = maksimal surge
    return (orderCount || 0) / driverCount;
  } catch { return 1; }
}

// ─── Surge hisoblash ─────────────────────────────────────────────────────────
async function calcSurge(sb, serviceType, lat, lng) {
  const { data: configs, error } = await sb
    .from("surge_config")
    .select("*")
    .eq("is_active", true)
    .or(`applies_to.eq.all,applies_to.eq.${serviceType || "standard"}`)
    .order("priority", { ascending: false });

  if (error || !configs?.length) return { multiplier: 1, reason: null };

  const now = timeNowHHMM();
  const today = dayOfWeekNum();
  const weatherCode = await fetchWeatherCode(lat, lng);
  const demandRatio = await calcDemandRatio(sb);

  let bestMult = 1;
  let reason = null;

  for (const cfg of configs) {
    let match = false;

    if (cfg.rule_type === "time") {
      const dayMatch = !cfg.days_of_week || cfg.days_of_week.includes(today);
      match = dayMatch && inTimeRange(now, cfg.time_from, cfg.time_to);
    } else if (cfg.rule_type === "weather") {
      match = !!weatherCode && (cfg.weather_codes || []).includes(weatherCode);
    } else if (cfg.rule_type === "demand") {
      match = demandRatio >= Number(cfg.min_demand_ratio || 2);
    } else if (cfg.rule_type === "manual") {
      match = true; // Admin qo'lda yoqqan
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
}

// ─── Tarif hisoblash ──────────────────────────────────────────────────────────
const DEFAULT_TARIFFS = {
  standard: { base: 5000, per_km: 1200, per_min: 200, min_fare: 8000 },
  comfort:  { base: 8000, per_km: 1600, per_min: 250, min_fare: 12000 },
  truck:    { base: 15000, per_km: 2500, per_min: 300, min_fare: 20000 },
};

async function getTariffConfig(sb, serviceType) {
  // Supabase'da tariff_config jadvali bo'lsa undan oladi, bo'lmasa default
  try {
    const { data } = await sb.from("tariff_config").select("*").eq("service_type", serviceType).maybeSingle();
    if (data) return data;
  } catch { /* jadval yo'q bo'lsa default ishlatiladi */ }
  return DEFAULT_TARIFFS[serviceType] || DEFAULT_TARIFFS.standard;
}

// ─── GET handler ──────────────────────────────────────────────────────────────
async function handleGetPricing(sb, searchParams) {
  const serviceType = searchParams.get("service_type") || "standard";
  const distanceKm  = Number(searchParams.get("distance_km") || 0);
  const durationMin = Number(searchParams.get("duration_min") || 0);
  const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : null;
  const lng = searchParams.get("lng") ? Number(searchParams.get("lng")) : null;

  const [tariff, { multiplier, reason }] = await Promise.all([
    getTariffConfig(sb, serviceType),
    calcSurge(sb, serviceType, lat, lng),
  ]);

  const basePrice = Number(tariff.base || 0) + Number(tariff.per_km || 0) * distanceKm + Number(tariff.per_min || 0) * durationMin;
  const finalPrice = Math.max(Number(tariff.min_fare || 0), Math.round(basePrice * multiplier));

  return {
    ok: true,
    price_uzs: finalPrice,
    base_price_uzs: Math.round(basePrice),
    multiplier,
    surge_active: multiplier > 1,
    surge_reason: reason,
    service_type: serviceType,
    breakdown: {
      base: Number(tariff.base || 0),
      per_km: Number(tariff.per_km || 0),
      per_min: Number(tariff.per_min || 0),
      min_fare: Number(tariff.min_fare || 0),
      distance_km: distanceKm,
      duration_min: durationMin,
    },
  };
}

async function handleGetSurgeConfig(sb) {
  const { data, error } = await sb.from("surge_config").select("*").order("priority", { ascending: false });
  if (error) throw error;
  return { ok: true, configs: data || [] };
}

// ─── POST handler (admin) ─────────────────────────────────────────────────────
async function adminUpdateSurge(sb, body, callerUserId) {
  const isAdmin = await isAdminCheck(sb, callerUserId);
  if (!isAdmin) return { ok: false, error: "Admin huquqi kerak" };
  const { config_id, data: d } = body;
  if (!config_id) return { ok: false, error: "config_id kerak" };
  const allowed = ["name","rule_type","multiplier","min_multiplier","max_multiplier","time_from","time_to","days_of_week","weather_codes","weather_label","min_demand_ratio","is_active","applies_to","priority","description"];
  const update = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (d?.[k] !== undefined) update[k] = d[k];
  const { data, error } = await sb.from("surge_config").update(update).eq("id", config_id).select().single();
  if (error) throw error;
  return { ok: true, config: data };
}

async function adminCreateSurge(sb, body, callerUserId) {
  const isAdmin = await isAdminCheck(sb, callerUserId);
  if (!isAdmin) return { ok: false, error: "Admin huquqi kerak" };
  const { data: d } = body;
  if (!d?.name || !d?.rule_type) return { ok: false, error: "name va rule_type kerak" };
  const { data, error } = await sb.from("surge_config").insert([{
    name: d.name,
    rule_type: d.rule_type,
    multiplier: Number(d.multiplier || 1.2),
    min_multiplier: Number(d.min_multiplier || 1.0),
    max_multiplier: Number(d.max_multiplier || 3.0),
    time_from: d.time_from || null,
    time_to: d.time_to || null,
    days_of_week: d.days_of_week || null,
    weather_codes: d.weather_codes || null,
    weather_label: d.weather_label || null,
    min_demand_ratio: d.min_demand_ratio ? Number(d.min_demand_ratio) : null,
    is_active: d.is_active !== false,
    applies_to: d.applies_to || "all",
    priority: Number(d.priority || 0),
    description: d.description || null,
  }]).select().single();
  if (error) throw error;
  return { ok: true, config: data };
}

async function adminDeleteSurge(sb, body, callerUserId) {
  const isAdmin = await isAdminCheck(sb, callerUserId);
  if (!isAdmin) return { ok: false, error: "Admin huquqi kerak" };
  const { config_id } = body;
  if (!config_id) return { ok: false, error: "config_id kerak" };
  const { error } = await sb.from("surge_config").delete().eq("id", config_id);
  if (error) throw error;
  return { ok: true };
}

async function adminUpdateTariff(sb, body, callerUserId) {
  const isAdmin = await isAdminCheck(sb, callerUserId);
  if (!isAdmin) return { ok: false, error: "Admin huquqi kerak" };
  const { service_type, data: d } = body;
  if (!service_type) return { ok: false, error: "service_type kerak" };
  const update = {
    service_type,
    base: d.base !== undefined ? Number(d.base) : undefined,
    per_km: d.per_km !== undefined ? Number(d.per_km) : undefined,
    per_min: d.per_min !== undefined ? Number(d.per_min) : undefined,
    min_fare: d.min_fare !== undefined ? Number(d.min_fare) : undefined,
    updated_at: new Date().toISOString(),
  };
  // undefined maydonlarni olib tashlaymiz
  Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);
  try {
    const { data, error } = await sb.from("tariff_config").upsert([update], { onConflict: "service_type" }).select().single();
    if (error) throw error;
    return { ok: true, tariff: data };
  } catch {
    // tariff_config jadvali yo'q bo'lsa xabar berish
    return { ok: false, error: "tariff_config jadvali Supabase'da yo'q. supabase_gamification.sql'ni ishga tushiring." };
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (!hasEnv()) return serverError(res, "SUPABASE env topilmadi");
  const sb = getSupabaseAdmin();
  const url = new URL(req.url, "http://localhost");

  try {
    if (req.method === "GET") {
      const action = url.searchParams.get("action") || "";
      if (action === "surge_config") {
        return json(res, 200, await handleGetSurgeConfig(sb));
      }
      return json(res, 200, await handleGetPricing(sb, url.searchParams));
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const action = body.action || "";
      const callerUserId = (await getAuthedUserId(req, sb)) || "";

      if (action === "admin_update_surge") return json(res, 200, await adminUpdateSurge(sb, body, callerUserId));
      if (action === "admin_create_surge") return json(res, 200, await adminCreateSurge(sb, body, callerUserId));
      if (action === "admin_delete_surge") return json(res, 200, await adminDeleteSurge(sb, body, callerUserId));
      if (action === "admin_update_tariff") return json(res, 200, await adminUpdateTariff(sb, body, callerUserId));
      return badRequest(res, "action noma'lum");
    }

    return json(res, 405, { ok: false, error: "Method not allowed" });
  } catch (e) {
    return serverError(res, e);
  }
}