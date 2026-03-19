import { json, badRequest, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';
import { getRewardService } from '../_shared/reward-engine/factory.js';

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}');
  } catch {
    return {};
  }
}

async function getDriverStatus(rewardService, userId) {
  if (!userId) return { ok: false, error: 'user_id kerak' };
  const status = await rewardService.repositories.driverGamification.getStatus(userId);
  const currentLevel = (status.levels || []).find((item) => item.name === status.gamification?.level_name) || status.levels?.[0] || null;
  const nextLevel = currentLevel
    ? (status.levels || []).find((item) => Number(item.sort_order || 0) === Number(currentLevel.sort_order || 0) + 1) || null
    : null;

  return {
    ok: true,
    gamification: status.gamification,
    current_level: currentLevel,
    next_level: nextLevel,
    missions: status.missions,
    all_levels: status.levels,
  };
}

async function getWalletBonuses(rewardService, userId) {
  if (!userId) return { ok: false, error: 'user_id kerak' };

  const [wallet, txRows] = await Promise.all([
    rewardService.repositories.wallets.getWallet(userId),
    rewardService.sb
      .from('wallet_transactions')
      .select('id,kind,direction,amount_uzs,description,order_id,created_at,metadata')
      .eq('user_id', userId)
      .in('kind', ['bonus', 'referral_bonus', 'promo_bonus', 'mission_bonus', 'loyalty_bonus', 'spend'])
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (txRows.error) throw txRows.error;

  return {
    ok: true,
    bonuses: {
      user_id: userId,
      points: Number(wallet?.bonus_balance_uzs || 0),
      bonus_balance_uzs: Number(wallet?.bonus_balance_uzs || 0),
      total_earned: Number(wallet?.total_earned_uzs || 0),
      total_spent: Number(wallet?.total_spent_uzs || 0),
      updated_at: wallet?.updated_at || null,
    },
    history: (txRows.data || []).map((tx) => ({
      id: tx.id,
      kind: tx.kind,
      points: tx.direction === 'debit' ? -Number(tx.amount_uzs || 0) : Number(tx.amount_uzs || 0),
      uzs_value: Number(tx.amount_uzs || 0),
      note: tx.description || null,
      order_id: tx.order_id || null,
      metadata: tx.metadata || {},
      created_at: tx.created_at,
    })),
  };
}

async function useBonusBalance(rewardService, body, callerUserId) {
  const userId = String(body.user_id || callerUserId || '').trim();
  const points = Math.max(0, Math.round(Number(body.points || 0)));
  const orderId = String(body.order_id || '').trim() || null;

  if (!callerUserId || String(callerUserId) !== String(userId)) {
    return { ok: false, error: 'Faqat o\'zingizning bonus balansingizni ishlata olasiz' };
  }
  if (!userId || points <= 0) {
    return { ok: false, error: 'auth user va points kerak' };
  }

  const wallet = await rewardService.repositories.wallets.ensureWallet(userId);
  const currentBonus = Number(wallet?.bonus_balance_uzs || 0);
  if (currentBonus < points) {
    return { ok: false, error: `Yetarli bonus yo'q. Mavjud: ${currentBonus}` };
  }

  const result = await rewardService.repositories.wallets.applyMutation({
    userId,
    amountUzs: points,
    balanceField: 'bonus_balance_uzs',
    direction: 'debit',
    txKind: 'spend',
    description: 'Bonus balance spend',
    orderId,
    metadata: {
      source: 'gamification.use_bonus',
      wallet_balance_type: 'bonus_balance_uzs',
    },
  });

  return {
    ok: true,
    remaining_points: Number(result?.wallet?.bonus_balance_uzs || 0),
    uzs_discount: points,
  };
}

async function isAdmin(rewardService, userId) {
  return rewardService.repositories.profiles.isAdmin(userId);
}

export default async function handler(req, res) {
  try {
    if (!hasEnv()) return badRequest(res, 'SUPABASE env yo\'q');

    const sb = getSupabaseAdmin();
    const rewardService = getRewardService(sb);
    const callerUserId = await getAuthedUserId(req, sb);
    const url = new URL(req.url, 'http://localhost');
    const method = String(req.method || 'GET').toUpperCase();
    const body = method === 'GET' ? {} : await readBody(req);
    const action = String(body.action || url.searchParams.get('action') || '').trim().toLowerCase();

    if (method === 'GET') {
      if (action === 'driver_status') {
        const userId = String(url.searchParams.get('user_id') || callerUserId || '').trim();
        return json(res, 200, await getDriverStatus(rewardService, userId));
      }
      if (action === 'wallet_bonuses' || action === 'client_bonuses') {
        const userId = String(url.searchParams.get('user_id') || callerUserId || '').trim();
        return json(res, 200, await getWalletBonuses(rewardService, userId));
      }
      if (action === 'levels') {
        return json(res, 200, { ok: true, levels: await rewardService.repositories.driverGamification.listLevels() });
      }
      if (action === 'missions') {
        return json(res, 200, { ok: true, missions: await rewardService.repositories.driverGamification.listMissions() });
      }
      return badRequest(res, 'action noto\'g\'ri');
    }

    if (!callerUserId) return json(res, 401, { ok: false, error: 'Unauthorized' });

    if (action === 'use_bonus') {
      return json(res, 200, await useBonusBalance(rewardService, body, callerUserId));
    }

    if (!(await isAdmin(rewardService, callerUserId))) {
      return json(res, 403, { ok: false, error: 'Admin huquqi kerak' });
    }

    if (action === 'update_level' || action === 'admin_update_level') {
      const levelId = String(body.level_id || '').trim();
      if (!levelId) return badRequest(res, 'level_id kerak');
      const allowed = ['name', 'min_trips', 'min_rating', 'commission_rate', 'priority_dispatch', 'badge_color', 'badge_emoji', 'bonus_multiplier', 'sort_order'];
      const patch = {};
      for (const key of allowed) {
        if (body.data?.[key] !== undefined) patch[key] = body.data[key];
      }
      const level = await rewardService.repositories.driverGamification.updateLevel(levelId, patch);
      return json(res, 200, { ok: true, level });
    }

    if (action === 'update_mission' || action === 'admin_update_mission') {
      const missionId = String(body.mission_id || '').trim();
      if (!missionId) return badRequest(res, 'mission_id kerak');
      const allowed = ['title', 'description', 'target_type', 'target_value', 'bonus_uzs', 'bonus_points', 'level_name', 'is_active', 'valid_from', 'valid_to'];
      const patch = {};
      for (const key of allowed) {
        if (body.data?.[key] !== undefined) patch[key] = body.data[key];
      }
      const mission = await rewardService.repositories.driverGamification.updateMission(missionId, patch);
      return json(res, 200, { ok: true, mission });
    }

    if (action === 'create_mission' || action === 'admin_create_mission') {
      const mission = body.data || {};
      if (!mission.title || !mission.target_type) return badRequest(res, 'title va target_type kerak');
      const created = await rewardService.repositories.driverGamification.createMission({
        title: mission.title,
        description: mission.description || null,
        target_type: mission.target_type,
        target_value: Number(mission.target_value || 1),
        bonus_uzs: Number(mission.bonus_uzs || 0),
        bonus_points: Number(mission.bonus_points || 0),
        level_name: mission.level_name || null,
        is_active: mission.is_active !== false,
        valid_from: mission.valid_from || new Date().toISOString().slice(0, 10),
        valid_to: mission.valid_to || null,
      });
      return json(res, 200, { ok: true, mission: created });
    }

    if (action === 'delete_mission' || action === 'admin_delete_mission') {
      const missionId = String(body.mission_id || '').trim();
      if (!missionId) return badRequest(res, 'mission_id kerak');
      await rewardService.repositories.driverGamification.deleteMission(missionId);
      return json(res, 200, { ok: true });
    }

    return badRequest(res, 'action noto\'g\'ri');
  } catch (error) {
    return serverError(res, error);
  }
}
