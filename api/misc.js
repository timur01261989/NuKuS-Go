// api/misc.js (merged pricing + gamification)

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

import { json, badRequest, serverError, nowIso } from "./_shared/cors.js";
import { getSupabaseAdmin } from "./_shared/supabase.js";
import { requireAuth, requireVerifiedDriver } from "./_shared/auth.js";

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
    let res = await sb.from("profiles").select("is_admin,role").eq("id", userId).maybeSingle();

    // Fallback: some schemas use profiles.user_id instead of profiles.id
    if (res.error && (res.error.code === "42703" || /column\s+\"id\"\s+does\s+not\s+exist/i.test(res.error.message || ""))) {
      res = await sb.from("profiles").select("is_admin,role").eq("user_id", userId).maybeSingle();
    }

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
async function pricingHandler(req, res) {
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
      const callerUserId = body.caller_user_id || "";

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

/**
 * api/gamification.js
 * Gamifikatsiya API - haydovchi daraja, missiya, mijoz cashback
 *
 * GET  /api/gamification?action=driver_status&user_id=xxx
 *      → { level, missions, earnings, bonus_points, streak_days }
 *
 * GET  /api/gamification?action=client_bonuses&user_id=xxx
 *      → { points, total_earned, total_spent }
 *
 * POST /api/gamification  { action: "use_bonus", user_id, points, order_id }
 *      → { ok, remaining_points }
 *
 * GET  /api/gamification?action=levels
 *      → { levels: [...] }
 *
 * GET  /api/gamification?action=missions
 *      → { missions: [...] }  — admin uchun barcha missiyalar
 *
 * POST /api/gamification  { action: "admin_update_level", level_id, data: {...} }
 *      → admin daraja tahrirlash
 *
 * POST /api/gamification  { action: "admin_update_mission", mission_id, data: {...} }
 *      → admin missiya tahrirlash
 *
 * POST /api/gamification  { action: "admin_create_mission", data: {...} }
 *      → admin yangi missiya yaratish
 */

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isAdminCheck(sb, userId) {
  return (async () => {
    let res = await sb.from("profiles").select("role").eq("id", userId).maybeSingle();

    // Fallback: some schemas use profiles.user_id instead of profiles.id
    if (res.error && (res.error.code === "42703" || /column\s+\"id\"\s+does\s+not\s+exist/i.test(res.error.message || ""))) {
      res = await sb.from("profiles").select("role").eq("user_id", userId).maybeSingle();
    }

    const roleVal = res.data?.role;
    const adminVal = res.data?.is_admin;
    return roleVal === "admin" || adminVal === true;
  })();
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}"); } catch { return {}; }
}

// ─── GET actions ──────────────────────────────────────────────────────────────

async function getDriverStatus(sb, userId) {
  if (!userId) return badRequest(null, "user_id kerak");

  const [{ data: gamif }, { data: missions }, { data: levels }] = await Promise.all([
    sb.from("driver_gamification").select("*").eq("driver_id", userId).maybeSingle(),
    sb.from("daily_missions")
      .select("id,title,description,target_type,target_value,bonus_uzs,bonus_points,level_name")
      .eq("is_active", true)
      .or(`valid_to.is.null,valid_to.gte.${new Date().toISOString().split("T")[0]}`),
    sb.from("driver_levels").select("*").order("sort_order"),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const missionIds = (missions || []).map((m) => m.id);
  let progressRows = [];
  if (missionIds.length > 0) {
    const { data: pr } = await sb
      .from("mission_progress")
      .select("mission_id,current_value,completed,rewarded")
      .eq("driver_id", userId)
      .eq("date", today)
      .in("mission_id", missionIds);
    progressRows = pr || [];
  }

  const progressMap = {};
  for (const p of progressRows) progressMap[p.mission_id] = p;

  const enrichedMissions = (missions || []).map((m) => ({
    ...m,
    current_value: progressMap[m.id]?.current_value ?? 0,
    completed: progressMap[m.id]?.completed ?? false,
    rewarded: progressMap[m.id]?.rewarded ?? false,
  }));

  const currentLevel = (levels || []).find((l) => l.name === gamif?.level_name) || levels?.[0] || null;
  const nextLevel = currentLevel
    ? (levels || []).find((l) => l.sort_order === currentLevel.sort_order + 1) || null
    : null;

  return {
    ok: true,
    gamification: gamif || {
      driver_id: userId,
      level_name: "Yangi",
      total_trips: 0,
      total_earnings_uzs: 0,
      bonus_points: 0,
      streak_days: 0,
    },
    current_level: currentLevel,
    next_level: nextLevel,
    missions: enrichedMissions,
    all_levels: levels || [],
  };
}

async function getClientBonuses(sb, userId) {
  if (!userId) return { ok: false, error: "user_id kerak" };
  const { data } = await sb
    .from("client_bonuses")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  const { data: txs } = await sb
    .from("bonus_transactions")
    .select("kind,points,uzs_value,note,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return { ok: true, bonuses: data || { user_id: userId, points: 0, total_earned: 0, total_spent: 0 }, history: txs || [] };
}

async function getLevels(sb) {
  const { data, error } = await sb.from("driver_levels").select("*").order("sort_order");
  if (error) throw error;
  return { ok: true, levels: data || [] };
}

async function getMissions(sb) {
  const { data, error } = await sb.from("daily_missions").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return { ok: true, missions: data || [] };
}

// ─── POST actions ──────────────────────────────────────────────────────────────

async function useBonus(sb, body) {
  const { user_id, points, order_id } = body;
  if (!user_id || !points || points <= 0) return { ok: false, error: "user_id va points kerak" };

  const { data: bon } = await sb.from("client_bonuses").select("points").eq("user_id", user_id).maybeSingle();
  const current = bon?.points || 0;
  if (current < points) return { ok: false, error: `Yetarli ball yo'q. Mavjud: ${current}` };

  const remaining = current - points;
  const uzs_value = points; // 1 ball = 1 so'm (konfiguratsiya qilish mumkin)

  await sb.from("client_bonuses").upsert({ user_id, points: remaining, total_spent: (bon?.total_spent || 0) + points, updated_at: nowIso() }, { onConflict: "user_id" });
  await sb.from("bonus_transactions").insert([{ user_id, kind: "spend", points: -points, uzs_value, order_id: order_id || null, note: "Bonus ball sarflandi" }]);

  return { ok: true, remaining_points: remaining, uzs_discount: uzs_value };
}

async function adminUpdateLevel(sb, body, callerUserId) {
  const isAdmin = await isAdminCheck(sb, callerUserId);
  if (!isAdmin) return { ok: false, error: "Admin huquqi kerak" };
  const { level_id, data: levelData } = body;
  if (!level_id) return { ok: false, error: "level_id kerak" };
  const allowed = ["name", "min_trips", "min_rating", "commission_rate", "priority_dispatch", "badge_color", "badge_emoji", "bonus_multiplier", "sort_order"];
  const update = {};
  for (const k of allowed) if (levelData?.[k] !== undefined) update[k] = levelData[k];
  const { data, error } = await sb.from("driver_levels").update(update).eq("id", level_id).select().single();
  if (error) throw error;
  return { ok: true, level: data };
}

async function adminUpdateMission(sb, body, callerUserId) {
  const isAdmin = await isAdminCheck(sb, callerUserId);
  if (!isAdmin) return { ok: false, error: "Admin huquqi kerak" };
  const { mission_id, data: mData } = body;
  if (!mission_id) return { ok: false, error: "mission_id kerak" };
  const allowed = ["title", "description", "target_type", "target_value", "bonus_uzs", "bonus_points", "level_name", "is_active", "valid_from", "valid_to"];
  const update = {};
  for (const k of allowed) if (mData?.[k] !== undefined) update[k] = mData[k];
  const { data, error } = await sb.from("daily_missions").update(update).eq("id", mission_id).select().single();
  if (error) throw error;
  return { ok: true, mission: data };
}

async function adminCreateMission(sb, body, callerUserId) {
  const isAdmin = await isAdminCheck(sb, callerUserId);
  if (!isAdmin) return { ok: false, error: "Admin huquqi kerak" };
  const { data: mData } = body;
  if (!mData?.title || !mData?.target_type) return { ok: false, error: "title va target_type kerak" };
  const { data, error } = await sb.from("daily_missions").insert([{
    title: mData.title,
    description: mData.description || null,
    target_type: mData.target_type,
    target_value: Number(mData.target_value || 1),
    bonus_uzs: Number(mData.bonus_uzs || 0),
    bonus_points: Number(mData.bonus_points || 0),
    level_name: mData.level_name || null,
    is_active: mData.is_active !== false,
    valid_from: mData.valid_from || new Date().toISOString().split("T")[0],
    valid_to: mData.valid_to || null,
  }]).select().single();
  if (error) throw error;
  return { ok: true, mission: data };
}

async function adminDeleteMission(sb, body, callerUserId) {
  const isAdmin = await isAdminCheck(sb, callerUserId);
  if (!isAdmin) return { ok: false, error: "Admin huquqi kerak" };
  const { mission_id } = body;
  if (!mission_id) return { ok: false, error: "mission_id kerak" };
  const { error } = await sb.from("daily_missions").delete().eq("id", mission_id);
  if (error) throw error;
  return { ok: true };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function gamificationHandler(req, res) {
  if (!hasEnv()) return serverError(res, "SUPABASE env topilmadi");

  const sb = getSupabaseAdmin();
  const url = new URL(req.url, "http://localhost");

  try {
    if (req.method === "GET") {
      const action = url.searchParams.get("action") || "";
      const userId = url.searchParams.get("user_id") || "";

      if (action === "driver_status") {
        const result = await getDriverStatus(sb, userId);
        return json(res, 200, result);
      }
      if (action === "client_bonuses") {
        const result = await getClientBonuses(sb, userId);
        return json(res, 200, result);
      }
      if (action === "levels") {
        const result = await getLevels(sb);
        return json(res, 200, result);
      }
      if (action === "missions") {
        const result = await getMissions(sb);
        return json(res, 200, result);
      }
      return badRequest(res, "action noma'lum");
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const action = body.action || "";
      const callerUserId = body.caller_user_id || body.user_id || "";

      if (action === "use_bonus") return json(res, 200, await useBonus(sb, body));
      if (action === "admin_update_level") return json(res, 200, await adminUpdateLevel(sb, body, callerUserId));
      if (action === "admin_update_mission") return json(res, 200, await adminUpdateMission(sb, body, callerUserId));
      if (action === "admin_create_mission") return json(res, 200, await adminCreateMission(sb, body, callerUserId));
      if (action === "admin_delete_mission") return json(res, 200, await adminDeleteMission(sb, body, callerUserId));
      return badRequest(res, "action noma'lum");
    }

    return json(res, 405, { ok: false, error: "Method not allowed" });
  } catch (e) {
    return serverError(res, e);
  }
}



function logicalPath(req){
  const url = new URL(req.url, "http://localhost");
  const qp = url.searchParams.get("path");
  if (qp) return String(qp).replace(/^\/+/, "");
  return (url.pathname || "").replace(/^\/api\//, "").replace(/^\/+/, "");
}

// ───────────────────────────────────────────────────────────────
// REGIONS (BASE server/api/regions.js)
async function regionsHandler(req, res) {
  const sb = getSupabaseAdmin();
  const p = logicalPath(req);
  const parts = p.split("/").filter(Boolean);

  if (req.method === "GET" && parts.length === 1) {
    const { data, error } = await sb.from("regions").select("*").order("name_uz_latn");
    if (error) return serverError(res, error);
    return json(res, 200, { success: true, data });
  }

  if (req.method === "GET" && parts.length === 3 && parts[2] === "districts") {
    const regionId = parts[1];
    const { data, error } = await sb.from("districts").select("*").eq("region_id", regionId).order("name_uz_latn");
    if (error) return serverError(res, error);
    return json(res, 200, { success: true, data });
  }

  return json(res, 404, { success:false, message:"Regions endpoint not found" });
}

// USERS (BASE server/api/users.js)
async function usersHandler(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const sb = getSupabaseAdmin();
  const p = logicalPath(req);
  const parts = p.split("/").filter(Boolean);

  if (req.method === "GET" && parts[0]==="v1" && parts[1]==="users" && parts[2]==="me") {
    return json(res, 200, { success:true, data: auth.userRow });
  }

  if (req.method === "PUT" && parts[0]==="v1" && parts[1]==="users" && parts[2]==="me") {
    const body = await readBody(req);
    const updates = { ...(body||{}) };
    delete updates.id; delete updates.role; delete updates.created_at;

    const { data, error } = await sb.from("users").update(updates).eq("id", auth.userId).select().maybeSingle();
    if (error) return serverError(res, error);

    return json(res, 200, { success:true, data });
  }

  return json(res, 404, { success:false, message:"Users endpoint not found" });
}

// INTERCITY (BASE server/api/intercity.js)
async function intercityHandler(req, res) {
  const sb = getSupabaseAdmin();
  const p = logicalPath(req);
  const parts = p.split("/").filter(Boolean);

  // GET /api/v1/intercity/search
  if (req.method === "GET" && parts[0]==="v1" && parts[1]==="intercity" && parts[2]==="search") {
    const url = new URL(req.url, "http://localhost");
    const q = url.searchParams;
    const from_region_id = q.get("from_region_id");
    const to_region_id = q.get("to_region_id");
    const from_district_id = q.get("from_district_id");
    const to_district_id = q.get("to_district_id");
    const departure_date = q.get("departure_date");
    const seats_needed = Number(q.get("seats_needed") || 1);

    let query = sb
      .from("intercity_routes")
      .select(`
        *,
        driver:users!driver_id(id, full_name, phone, avatar_url, rating),
        from_region:regions!from_region_id(name_uz_latn, name_ru, name_en),
        to_region:regions!to_region_id(name_uz_latn, name_ru, name_en),
        from_district:districts!from_district_id(name_uz_latn, name_ru, name_en),
        to_district:districts!to_district_id(name_uz_latn, name_ru, name_en)
      `)
      .eq("status", "active")
      .gte("available_seats", seats_needed);

    if (from_region_id) query = query.eq("from_region_id", from_region_id);
    if (to_region_id) query = query.eq("to_region_id", to_region_id);
    if (from_district_id) query = query.eq("from_district_id", from_district_id);
    if (to_district_id) query = query.eq("to_district_id", to_district_id);
    if (departure_date) query = query.eq("departure_date", departure_date);

    const { data, error } = await query.order("departure_date").order("departure_time");
    if (error) return serverError(res, error);
    return json(res, 200, { success:true, data });
  }

  // GET /api/v1/intercity/:id
  if (req.method === "GET" && parts[0]==="v1" && parts[1]==="intercity" && parts.length===3) {
    const id = parts[2];
    const { data, error } = await sb
      .from("intercity_routes")
      .select(`
        *,
        driver:users!driver_id(id, full_name, phone, avatar_url, rating, created_at),
        driver_profile:driver_profiles!driver_id(car_model, car_color, car_number, car_year),
        from_region:regions!from_region_id(*),
        to_region:regions!to_region_id(*),
        from_district:districts!from_district_id(*),
        to_district:districts!to_district_id(*),
        bookings:intercity_bookings(id, seats_booked, status, client:users!client_id(full_name, avatar_url))
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return json(res, 404, { success:false, message:"Route not found" });
    return json(res, 200, { success:true, data });
  }

  // POST /api/v1/intercity (driver)
  if (req.method === "POST" && parts[0]==="v1" && parts[1]==="intercity" && parts.length===2) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const driverCtx = await requireVerifiedDriver(req, res, auth);
    if (!driverCtx) return;

    const body = await readBody(req);
    const {
      from_region_id, from_district_id, to_region_id, to_district_id,
      departure_location, departure_address,
      arrival_location, arrival_address,
      departure_date, departure_time,
      total_seats, price_per_seat,
      full_car_price, pickup_from_home_price, delivery_to_home_price,
      car_features, car_class, notes
    } = body || {};

    if (!from_region_id || !to_region_id || !departure_date || !departure_time || !total_seats || !price_per_seat) {
      return badRequest(res, "Missing required fields");
    }

    const { data, error } = await sb
      .from("intercity_routes")
      .insert({
        driver_id: driverCtx.userId,
        from_region_id,
        from_district_id,
        to_region_id,
        to_district_id,
        departure_location,
        departure_address,
        arrival_location,
        arrival_address,
        departure_date,
        departure_time,
        total_seats,
        available_seats: total_seats,
        price_per_seat,
        full_car_price,
        pickup_from_home_price,
        delivery_to_home_price,
        car_features,
        car_class,
        notes,
        status: "active"
      })
      .select()
      .maybeSingle();

    if (error) return serverError(res, error);
    return json(res, 201, { success:true, data });
  }

  // PUT /api/v1/intercity/:id (driver)
  if (req.method === "PUT" && parts[0]==="v1" && parts[1]==="intercity" && parts.length===3) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const driverCtx = await requireVerifiedDriver(req, res, auth);
    if (!driverCtx) return;

    const id = parts[2];
    const body = await readBody(req);

    const { data, error } = await sb
      .from("intercity_routes")
      .update(body || {})
      .eq("id", id)
      .eq("driver_id", driverCtx.userId)
      .select()
      .maybeSingle();

    if (error) return serverError(res, error);
    if (!data) return json(res, 404, { success:false, message:"Route not found" });
    return json(res, 200, { success:true, data });
  }

  // DELETE /api/v1/intercity/:id (driver)
  if (req.method === "DELETE" && parts[0]==="v1" && parts[1]==="intercity" && parts.length===3) {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const driverCtx = await requireVerifiedDriver(req, res, auth);
    if (!driverCtx) return;

    const id = parts[2];
    const { data, error } = await sb
      .from("intercity_routes")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("driver_id", driverCtx.userId)
      .select()
      .maybeSingle();

    if (error) return serverError(res, error);
    if (!data) return json(res, 404, { success:false, message:"Route not found" });
    return json(res, 200, { success:true, data });
  }

  // POST /api/v1/intercity/:id/book (client)
  if (req.method === "POST" && parts[0]==="v1" && parts[1]==="intercity" && parts.length===4 && parts[3]==="book") {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const id = parts[2];
    const body = await readBody(req);
    const seats_booked = Number(body?.seats_booked || 1);

    const { data: route, error: rErr } = await sb.from("intercity_routes").select("available_seats,status").eq("id", id).maybeSingle();
    if (rErr || !route) return json(res, 404, { success:false, message:"Route not found" });
    if (route.status !== "active") return badRequest(res, "Route not active");
    if ((route.available_seats || 0) < seats_booked) return badRequest(res, "Not enough seats");

    const { data: booking, error } = await sb
      .from("intercity_bookings")
      .insert({
        route_id: id,
        client_id: auth.userId,
        seats_booked,
        status: "pending"
      })
      .select()
      .maybeSingle();
    if (error) return serverError(res, error);

    await sb.from("intercity_routes").update({ available_seats: (route.available_seats - seats_booked) }).eq("id", id);

    return json(res, 201, { success:true, data: booking });
  }

  // GET /api/v1/intercity/my/routes (driver)
  if (req.method === "GET" && parts[0]==="v1" && parts[1]==="intercity" && parts[2]==="my" && parts[3]==="routes") {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const driverCtx = await requireVerifiedDriver(req, res, auth);
    if (!driverCtx) return;

    const { data, error } = await sb
      .from("intercity_routes")
      .select("*")
      .eq("driver_id", driverCtx.userId)
      .order("departure_date", { ascending: true })
      .order("departure_time", { ascending: true });

    if (error) return serverError(res, error);
    return json(res, 200, { success:true, data });
  }

  return json(res, 404, { success:false, message:"Intercity endpoint not found" });
}

export default async function handler(req,res){
  const key=req.__routeKey||'';
  const p=logicalPath(req);

  if(key==='pricing') return pricingHandler(req,res);
  if(key==='gamification') return gamificationHandler(req,res);

  if(p.startsWith('pricing') || p.includes('/pricing')) return pricingHandler(req,res);
  if(p.startsWith('gamification') || p.includes('/gamification')) return gamificationHandler(req,res);

  if(p.startsWith('regions')) return regionsHandler(req,res);
  if(p.startsWith('v1/users') || p.startsWith('users')) return usersHandler(req,res);
  if(p.startsWith('v1/intercity') || p.startsWith('intercity')) return intercityHandler(req,res);

  res.statusCode=404;
  return res.end(JSON.stringify({error:'Unknown misc route', path:p, key}));
}
