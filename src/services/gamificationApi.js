/**
 * gamificationApi.js
 * Gamifikatsiya frontend API chaqiruvlari
 *
 * Ishlatilish joylari:
 *  - LevelBadge.jsx (haydovchi daraja)
 *  - DailyMissions.jsx (kunlik missiyalar)
 *  - ClientTaxiPage.jsx (cashback)
 */
const API_BASE = (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");

async function getJson(path) {
  const r = await fetch(`${API_BASE}${path}`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

async function postJson(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

/** Haydovchi gamifikatsiya holati: daraja, missiyalar, bonus balllar */
export function getDriverStatus(userId) {
  return getJson(`/api/gamification?action=driver_status&user_id=${encodeURIComponent(userId)}`);
}

/** Mijoz cashback balllar */
export function getClientBonuses(userId) {
  return getJson(`/api/gamification?action=client_bonuses&user_id=${encodeURIComponent(userId)}`);
}

/** Barcha darajalar ro'yxati */
export function getDriverLevels() {
  return getJson("/api/gamification?action=levels");
}

/** Barcha missiyalar (admin uchun) */
export function getAllMissions() {
  return getJson("/api/gamification?action=missions");
}

/** Bonus balllarni sarflash */
export function useBonusPoints({ userId, points, orderId }) {
  return postJson("/api/gamification", {
    action: "use_bonus",
    user_id: userId,
    points,
    order_id: orderId || null,
  });
}

/** Admin: daraja tahrirlash */
export function adminUpdateLevel(callerUserId, levelId, data) {
  return postJson("/api/gamification", {
    action: "admin_update_level",
    caller_user_id: callerUserId,
    level_id: levelId,
    data,
  });
}

/** Admin: missiya tahrirlash */
export function adminUpdateMission(callerUserId, missionId, data) {
  return postJson("/api/gamification", {
    action: "admin_update_mission",
    caller_user_id: callerUserId,
    mission_id: missionId,
    data,
  });
}

/** Admin: yangi missiya yaratish */
export function adminCreateMission(callerUserId, data) {
  return postJson("/api/gamification", {
    action: "admin_create_mission",
    caller_user_id: callerUserId,
    data,
  });
}

/** Admin: missiya o'chirish */
export function adminDeleteMission(callerUserId, missionId) {
  return postJson("/api/gamification", {
    action: "admin_delete_mission",
    caller_user_id: callerUserId,
    mission_id: missionId,
  });
}
