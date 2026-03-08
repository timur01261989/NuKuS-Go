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
import { json, badRequest, serverError, nowIso } from "../_shared/cors.js";
import { getSupabaseAdmin, getAuthedUserId } from "../_shared/supabase.js";

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isAdminCheck(sb, userId) {
  return (async () => {
    const res = await sb.from("profiles").select("role,is_admin").eq("id", userId).maybeSingle();
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
  if (!user_id || !points || points <= 0) return { ok: false, error: "auth user va points kerak" };

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

export default async function handler(req, res) {
  if (!hasEnv()) return serverError(res, "SUPABASE env topilmadi");

  const sb = getSupabaseAdmin();
  const url = new URL(req.url, "http://localhost");

  try {
    if (req.method === "GET") {
      const action = url.searchParams.get("action") || "";
      const authedUserId = await getAuthedUserId(req, sb);
      const userId = authedUserId || url.searchParams.get("user_id") || "";

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
      const callerUserId = (await getAuthedUserId(req, sb)) || "";

      if (action === "use_bonus") {
        const authedUserId = await getAuthedUserId(req, sb);
        return json(res, 200, await useBonus(sb, { ...body, user_id: authedUserId || body.user_id || null }));
      }
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