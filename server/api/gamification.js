/**
 * api/gamification.js
 * Gamifikatsiya API - haydovchi daraja, missiya va wallet bonus qatlamiga o‘tkazilgan mijoz rewardlari
 */
import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isAdminCheck(sb, userId) {
  return (async () => {
    const res = await sb.from('profiles').select('role,is_admin').eq('id', userId).maybeSingle();
    const roleVal = res.data?.role;
    const adminVal = res.data?.is_admin;
    return roleVal === 'admin' || adminVal === true;
  })();
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}'); } catch { return {}; }
}

async function getDriverStatus(sb, userId) {
  if (!userId) return badRequest(null, 'user_id kerak');

  const [{ data: gamif }, { data: missions }, { data: levels }] = await Promise.all([
    sb.from('driver_gamification').select('*').eq('driver_id', userId).maybeSingle(),
    sb.from('daily_missions')
      .select('id,title,description,target_type,target_value,bonus_uzs,bonus_points,level_name')
      .eq('is_active', true)
      .or(`valid_to.is.null,valid_to.gte.${new Date().toISOString().split('T')[0]}`),
    sb.from('driver_levels').select('*').order('sort_order'),
  ]);

  const today = new Date().toISOString().split('T')[0];
  const missionIds = (missions || []).map((m) => m.id);
  let progressRows = [];
  if (missionIds.length > 0) {
    const { data: pr } = await sb
      .from('mission_progress')
      .select('mission_id,current_value,completed,rewarded')
      .eq('driver_id', userId)
      .eq('date', today)
      .in('mission_id', missionIds);
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
  const nextLevel = currentLevel ? (levels || []).find((l) => l.sort_order === currentLevel.sort_order + 1) || null : null;

  return {
    ok: true,
    gamification: gamif || {
      driver_id: userId,
      level_name: 'Yangi',
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
  if (!userId) return { ok: false, error: 'user_id kerak' };

  const [{ data: wallet, error: walletError }, { data: txs, error: txError }] = await Promise.all([
    sb
      .from('wallets')
      .select('user_id,bonus_balance_uzs,total_earned_uzs,total_spent_uzs,updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
    sb
      .from('wallet_transactions')
      .select('id,kind,direction,amount_uzs,description,order_id,created_at,metadata')
      .eq('user_id', userId)
      .in('kind', ['bonus', 'spend'])
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (walletError) throw walletError;
  if (txError) throw txError;

  const bonuses = {
    user_id: userId,
    points: Number(wallet?.bonus_balance_uzs || 0),
    bonus_balance_uzs: Number(wallet?.bonus_balance_uzs || 0),
    total_earned: Number(wallet?.total_earned_uzs || 0),
    total_spent: Number(wallet?.total_spent_uzs || 0),
    updated_at: wallet?.updated_at || null,
  };

  const history = (txs || []).map((tx) => ({
    id: tx.id,
    kind: tx.kind,
    points: tx.direction === 'debit' ? -Number(tx.amount_uzs || 0) : Number(tx.amount_uzs || 0),
    uzs_value: Number(tx.amount_uzs || 0),
    note: tx.description || null,
    order_id: tx.order_id || null,
    metadata: tx.metadata || {},
    created_at: tx.created_at,
  }));

  return { ok: true, bonuses, history };
}

async function useBonus(sb, body, callerUserId) {
  const requestedUserId = body.user_id || callerUserId;
  const userId = requestedUserId || callerUserId;
  const points = Math.max(0, Math.round(Number(body.points || 0)));
  const orderId = body.order_id || null;

  if (!callerUserId || String(callerUserId) !== String(userId)) return { ok: false, error: 'Faqat o\'zingizning bonus balansingizni ishlata olasiz' };
  if (!userId || points <= 0) return { ok: false, error: 'auth user va points kerak' };

  const { data: wallet, error: walletError } = await sb
    .from('wallets')
    .select('user_id,balance_uzs,bonus_balance_uzs,reserved_uzs,total_topup_uzs,total_spent_uzs,total_earned_uzs,is_frozen')
    .eq('user_id', userId)
    .maybeSingle();
  if (walletError) throw walletError;

  const currentBonus = Number(wallet?.bonus_balance_uzs || 0);
  if (currentBonus < points) return { ok: false, error: `Yetarli bonus yo'q. Mavjud: ${currentBonus}` };

  const nextBonus = currentBonus - points;
  const { error: updateError } = await sb.from('wallets').upsert({
    user_id: userId,
    balance_uzs: Number(wallet?.balance_uzs || 0),
    bonus_balance_uzs: nextBonus,
    reserved_uzs: Number(wallet?.reserved_uzs || 0),
    total_topup_uzs: Number(wallet?.total_topup_uzs || 0),
    total_spent_uzs: Number(wallet?.total_spent_uzs || 0) + points,
    total_earned_uzs: Number(wallet?.total_earned_uzs || 0),
    is_frozen: Boolean(wallet?.is_frozen || false),
    updated_at: nowIso(),
  }, { onConflict: 'user_id' });
  if (updateError) throw updateError;

  const { error: txError } = await sb.from('wallet_transactions').insert([{
    user_id: userId,
    direction: 'debit',
    kind: 'spend',
    amount_uzs: points,
    order_id: orderId,
    description: 'Bonus balance spend',
    metadata: { source: 'gamification.use_bonus', wallet_balance_type: 'bonus_balance_uzs' },
    meta: { source: 'gamification.use_bonus', wallet_balance_type: 'bonus_balance_uzs' },
  }]);
  if (txError) throw txError;

  return { ok: true, remaining_points: nextBonus, uzs_discount: points };
}

async function getLevels(sb) {
  const { data, error } = await sb.from('driver_levels').select('*').order('sort_order');
  if (error) throw error;
  return { ok: true, levels: data || [] };
}

async function getMissions(sb) {
  const { data, error } = await sb.from('daily_missions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return { ok: true, missions: data || [] };
}

async function adminUpdateLevel(sb, body, callerUserId) {
  const isAdmin = await isAdminCheck(sb, callerUserId);
  if (!isAdmin) return { ok: false, error: 'Admin huquqi kerak' };
  const { level_id, data: levelData } = body;
  if (!level_id) return { ok: false, error: 'level_id kerak' };
  const allowed = ['name', 'min_trips', 'min_rating', 'commission_rate', 'priority_dispatch', 'badge_color', 'badge_emoji', 'bonus_multiplier', 'sort_order'];
  const update = {};
  for (const k of allowed) if (levelData?.[k] !== undefined) update[k] = levelData[k];
  const { data, error } = await sb.from('driver_levels').update(update).eq('id', level_id).select().single();
  if (error) throw error;
  return { ok: true, level: data };
}

async function adminUpdateMission(sb, body, callerUserId) {
  const isAdmin = await isAdminCheck(sb, callerUserId);
  if (!isAdmin) return { ok: false, error: 'Admin huquqi kerak' };
  const { mission_id, data: mData } = body;
  if (!mission_id) return { ok: false, error: 'mission_id kerak' };
  const allowed = ['title', 'description', 'target_type', 'target_value', 'bonus_uzs', 'bonus_points', 'level_name', 'is_active', 'valid_from', 'valid_to'];
  const update = {};
  for (const k of allowed) if (mData?.[k] !== undefined) update[k] = mData[k];
  const { data, error } = await sb.from('daily_missions').update(update).eq('id', mission_id).select().single();
  if (error) throw error;
  return { ok: true, mission: data };
}

async function adminCreateMission(sb, body, callerUserId) {
  const isAdmin = await isAdminCheck(sb, callerUserId);
  if (!isAdmin) return { ok: false, error: 'Admin huquqi kerak' };
  const { data: mData } = body;
  if (!mData?.title || !mData?.target_type) return { ok: false, error: 'title va target_type kerak' };
  const { data, error } = await sb.from('daily_missions').insert([{
    title: mData.title,
    description: mData.description || null,
    target_type: mData.target_type,
    target_value: Number(mData.target_value || 1),
    bonus_uzs: Number(mData.bonus_uzs || 0),
    bonus_points: Number(mData.bonus_points || 0),
    level_name: mData.level_name || null,
    is_active: mData.is_active !== false,
    valid_from: mData.valid_from || new Date().toISOString().split('T')[0],
    valid_to: mData.valid_to || null,
  }]).select().single();
  if (error) throw error;
  return { ok: true, mission: data };
}

async function adminDeleteMission(sb, body, callerUserId) {
  const isAdmin = await isAdminCheck(sb, callerUserId);
  if (!isAdmin) return { ok: false, error: 'Admin huquqi kerak' };
  const { mission_id } = body;
  if (!mission_id) return { ok: false, error: 'mission_id kerak' };
  const { error } = await sb.from('daily_missions').delete().eq('id', mission_id);
  if (error) throw error;
  return { ok: true };
}

export default async function handler(req, res) {
  if (!hasEnv()) return serverError(res, 'SUPABASE env topilmadi');

  const sb = getSupabaseAdmin();
  const url = new URL(req.url, 'http://localhost');

  try {
    if (req.method === 'GET') {
      const action = url.searchParams.get('action') || '';
      const authedUserId = await getAuthedUserId(req, sb);
      const userId = authedUserId || url.searchParams.get('user_id') || '';

      if (action === 'driver_status') {
        const result = await getDriverStatus(sb, userId);
        return json(res, 200, result);
      }
      if (action === 'client_bonuses') {
        const result = await getClientBonuses(sb, userId);
        return json(res, 200, result);
      }
      if (action === 'levels') {
        const result = await getLevels(sb);
        return json(res, 200, result);
      }
      if (action === 'missions') {
        const result = await getMissions(sb);
        return json(res, 200, result);
      }
      return badRequest(res, "action noma'lum");
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const action = body.action || '';
      const callerUserId = (await getAuthedUserId(req, sb)) || '';

      if (action === 'use_bonus') {
        const result = await useBonus(sb, body, callerUserId);
        return json(res, result.ok ? 200 : 400, result);
      }
      if (action === 'admin_update_level') {
        const result = await adminUpdateLevel(sb, body, callerUserId);
        return json(res, result.ok ? 200 : 403, result);
      }
      if (action === 'admin_update_mission') {
        const result = await adminUpdateMission(sb, body, callerUserId);
        return json(res, result.ok ? 200 : 403, result);
      }
      if (action === 'admin_create_mission') {
        const result = await adminCreateMission(sb, body, callerUserId);
        return json(res, result.ok ? 200 : 403, result);
      }
      if (action === 'admin_delete_mission') {
        const result = await adminDeleteMission(sb, body, callerUserId);
        return json(res, result.ok ? 200 : 403, result);
      }

      return badRequest(res, "action noma'lum");
    }

    return badRequest(res, 'Unsupported method');
  } catch (error) {
    return serverError(res, error);
  }
}
