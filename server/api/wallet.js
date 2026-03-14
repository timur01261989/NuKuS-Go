import { applyCors, json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';
import { getRewardService } from '../_shared/reward-engine/factory.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const normalized = String(header).trim();
  if (!normalized.toLowerCase().startsWith('bearer ')) return null;
  return normalized.slice(7).trim() || null;
}

async function getAuthedUser(req) {
  const token = getBearerToken(req);
  if (!token) return { ok: false, status: 401, message: 'Unauthorized' };

  const sb = getSupabaseAdmin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return { ok: false, status: 401, message: 'Invalid token' };

  return { ok: true, user: data.user, token };
}

function parseJsonBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return {};
    }
  }
  return req.body && typeof req.body === 'object' ? req.body : {};
}

function getBalanceFieldBySpendMode(spendMode) {
  return String(spendMode || 'main').trim().toLowerCase() === 'bonus' ? 'bonus_balance_uzs' : 'balance_uzs';
}

async function getAuthorizedUserId(req, userIdFromInput = null) {
  const auth = await getAuthedUser(req);
  if (!auth.ok) return auth;

  const authedUserId = String(auth.user.id);
  const requestedUserId = String(userIdFromInput || '').trim();
  if (requestedUserId && requestedUserId !== authedUserId) {
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  return {
    ok: true,
    auth,
    authedUserId,
    userId: requestedUserId || authedUserId,
  };
}

export async function wallet_balance_handler(req, res) {
  try {
    if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) {
      return serverError(res, "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q");
    }

    const access = await getAuthorizedUserId(req, req.query?.user_id);
    if (!access.ok) return json(res, access.status, { ok: false, error: access.message });

    const rewardService = getRewardService(getSupabaseAdmin());
    const wallet = await rewardService.repositories.wallets.ensureWallet(access.userId);

    return json(res, 200, {
      ok: true,
      wallet: wallet || {
        user_id: access.userId,
        balance_uzs: 0,
        bonus_balance_uzs: 0,
        reserved_uzs: 0,
        total_topup_uzs: 0,
        total_spent_uzs: 0,
        total_earned_uzs: 0,
        is_frozen: false,
        updated_at: nowIso(),
      },
    });
  } catch (error) {
    return serverError(res, error);
  }
}

export async function wallet_transactions_handler(req, res) {
  try {
    if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) {
      return serverError(res, "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q");
    }

    const access = await getAuthorizedUserId(req, req.query?.user_id);
    if (!access.ok) return json(res, access.status, { ok: false, error: access.message });

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('wallet_transactions')
      .select('id,user_id,direction,kind,service_type,amount_uzs,order_id,description,metadata,created_at')
      .eq('user_id', access.userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return json(res, 200, { ok: true, rows: data || [] });
  } catch (error) {
    return serverError(res, error);
  }
}

export async function wallet_topup_demo_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) {
      return serverError(res, "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q");
    }

    const body = parseJsonBody(req);
    const access = await getAuthorizedUserId(req, body.user_id);
    if (!access.ok) return json(res, access.status, { ok: false, error: access.message });

    const amountUzs = Math.round(Number(body.amount_uzs || 0));
    if (!Number.isFinite(amountUzs) || amountUzs <= 0) {
      return badRequest(res, "amount_uzs noto'g'ri");
    }

    const rewardService = getRewardService(getSupabaseAdmin());
    const result = await rewardService.repositories.wallets.applyMutation({
      userId: access.userId,
      amountUzs,
      balanceField: 'balance_uzs',
      direction: 'credit',
      txKind: 'topup',
      description: 'Demo wallet topup',
      metadata: {
        source: 'wallet_topup_demo_handler',
        demo: true,
      },
    });

    return json(res, 200, {
      ok: true,
      balance_uzs: Number(result?.wallet?.balance_uzs || 0),
      wallet: result?.wallet || null,
      tx: {
        id: result?.wallet_transaction_id || null,
        amount_uzs: amountUzs,
        kind: 'topup',
        direction: 'credit',
      },
    });
  } catch (error) {
    return serverError(res, error);
  }
}

export async function wallet_spend_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) {
      return serverError(res, "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q");
    }

    const body = parseJsonBody(req);
    const access = await getAuthorizedUserId(req, body.user_id);
    if (!access.ok) return json(res, access.status, { ok: false, error: access.message });

    const amountUzs = Math.round(Number(body.amount_uzs || 0));
    const spendMode = String(body.spend_mode || 'main').trim().toLowerCase();
    const serviceType = String(body.service_type || '').trim() || null;
    const description = String(body.description || 'Wallet spend').trim() || 'Wallet spend';
    const orderId = String(body.order_id || '').trim() || null;

    if (!Number.isFinite(amountUzs) || amountUzs <= 0) {
      return badRequest(res, "amount_uzs noto'g'ri");
    }
    if (!['main', 'bonus', 'bonus_first'].includes(spendMode)) {
      return badRequest(res, 'spend_mode noto\'g\'ri');
    }

    const rewardService = getRewardService(getSupabaseAdmin());
    const wallet = await rewardService.repositories.wallets.ensureWallet(access.userId);
    const currentMain = Number(wallet?.balance_uzs || 0);
    const currentBonus = Number(wallet?.bonus_balance_uzs || 0);

    const plannedBonusDebit = spendMode === 'bonus_first'
      ? Math.min(currentBonus, amountUzs)
      : spendMode === 'bonus'
        ? amountUzs
        : 0;
    const plannedMainDebit = spendMode === 'bonus_first'
      ? Math.max(0, amountUzs - plannedBonusDebit)
      : spendMode === 'main'
        ? amountUzs
        : 0;

    if (plannedBonusDebit > currentBonus) {
      return json(res, 400, { ok: false, error: 'Yetarli bonus balans yo\'q' });
    }
    if (plannedMainDebit > currentMain) {
      return json(res, 400, { ok: false, error: 'Yetarli asosiy balans yo\'q' });
    }

    const txIds = [];
    if (plannedBonusDebit > 0) {
      const bonusResult = await rewardService.repositories.wallets.applyMutation({
        userId: access.userId,
        amountUzs: plannedBonusDebit,
        balanceField: 'bonus_balance_uzs',
        direction: 'debit',
        txKind: 'spend',
        description: `${description} (bonus)`,
        orderId,
        serviceType,
        metadata: {
          source: 'wallet_spend_handler',
          spend_mode: spendMode,
          wallet_balance_type: 'bonus_balance_uzs',
        },
      });
      if (bonusResult?.wallet_transaction_id) {
        txIds.push(bonusResult.wallet_transaction_id);
      }
    }

    if (plannedMainDebit > 0) {
      const mainResult = await rewardService.repositories.wallets.applyMutation({
        userId: access.userId,
        amountUzs: plannedMainDebit,
        balanceField: 'balance_uzs',
        direction: 'debit',
        txKind: 'spend',
        description: `${description}${spendMode === 'bonus_first' ? ' (main remainder)' : ''}`,
        orderId,
        serviceType,
        metadata: {
          source: 'wallet_spend_handler',
          spend_mode: spendMode,
          wallet_balance_type: 'balance_uzs',
        },
      });
      if (mainResult?.wallet_transaction_id) {
        txIds.push(mainResult.wallet_transaction_id);
      }
    }

    const refreshedWallet = await rewardService.repositories.wallets.getWallet(access.userId);
    return json(res, 200, {
      ok: true,
      wallet: refreshedWallet,
      breakdown: {
        main_debit_uzs: plannedMainDebit,
        bonus_debit_uzs: plannedBonusDebit,
        spend_mode: spendMode,
        service_type: serviceType,
      },
      wallet_transaction_ids: txIds,
    });
  } catch (error) {
    return serverError(res, error);
  }
}

export async function cashback_calc_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

    const body = parseJsonBody(req);
    const finalPriceUzs = Number(body.final_price_uzs || 0);
    const serviceType = String(body.service_type || 'standard').toLowerCase();

    if (!Number.isFinite(finalPriceUzs) || finalPriceUzs <= 0) {
      return badRequest(res, "final_price_uzs noto'g'ri");
    }

    let rate = 0.01;
    if (serviceType === 'comfort') rate = 0.02;
    if (serviceType === 'truck') rate = 0.0;

    return json(res, 200, { ok: true, cashback_uzs: Math.round(finalPriceUzs * rate), rate });
  } catch (error) {
    return serverError(res, error);
  }
}

export async function seat_hold_quote_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const body = parseJsonBody(req);
    const seats = Math.max(1, Number(body.seats || 1));
    const seatPrice = Math.max(0, Number(body.seat_price_uzs || 0));
    const holdAmount = Math.round(seats * seatPrice);
    return json(res, 200, { ok: true, hold_amount_uzs: holdAmount, seats, seat_price_uzs: seatPrice });
  } catch (error) {
    return serverError(res, error);
  }
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });

  const routeKey = req.query?.routeKey || req.routeKey || '';
  const action = String(req.query?.action || parseJsonBody(req)?.action || '').trim().toLowerCase();

  switch (routeKey || action) {
    case 'wallet':
      return await wallet_balance_handler(req, res);
    case 'wallet-topup-demo':
      return await wallet_topup_demo_handler(req, res);
    case 'wallet-transactions':
      return await wallet_transactions_handler(req, res);
    case 'wallet-spend':
    case 'spend':
      return await wallet_spend_handler(req, res);
    case 'cashback-calc':
      return await cashback_calc_handler(req, res);
    case 'seat-hold-calc':
      return await seat_hold_quote_handler(req, res);
    default:
      return req.method === 'POST'
        ? await wallet_spend_handler(req, res)
        : await wallet_balance_handler(req, res);
  }
}
