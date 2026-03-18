import { applyCors, json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';
import { getRewardService } from '../_shared/reward-engine/factory.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getBearerToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || '';
  const s = String(h).trim();
  if (!s.toLowerCase().startsWith('bearer ')) return null;
  return s.slice(7).trim() || null;
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

export async function wallet_balance_handler(req, res) {
  try {
    if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) {
      return serverError(res, "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q");
    }

    const auth = await getAuthedUser(req);
    if (!auth.ok) return json(res, auth.status, { ok: false, error: auth.message });

    const authedUserId = String(auth.user.id);
    const requestedUserId = String(req.query?.user_id || '').trim();
    if (requestedUserId && requestedUserId !== authedUserId) {
      return json(res, 403, { ok: false, error: "Forbidden: boshqa user wallet'ini ko'ra olmaysiz" });
    }

    const user_id = requestedUserId || authedUserId;
    const rewardService = getRewardService(getSupabaseAdmin());
    const wallet = await rewardService.repositories.wallets.ensureWallet(user_id);

    return json(res, 200, {
      ok: true,
      wallet: wallet || {
        user_id,
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
  } catch (e) {
    return serverError(res, e);
  }
}

export async function wallet_transactions_handler(req, res) {
  try {
    if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) {
      return serverError(res, "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q");
    }

    const auth = await getAuthedUser(req);
    if (!auth.ok) return json(res, auth.status, { ok: false, error: auth.message });

    const authedUserId = String(auth.user.id);
    const requestedUserId = String(req.query?.user_id || '').trim();
    if (requestedUserId && requestedUserId !== authedUserId) {
      return json(res, 403, { ok: false, error: "Forbidden: boshqa user wallet history sini ko'ra olmaysiz" });
    }

    const user_id = requestedUserId || authedUserId;
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('wallet_transactions')
      .select('id,user_id,direction,kind,service_type,amount_uzs,order_id,description,metadata,created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return json(res, 200, { ok: true, rows: data || [] });
  } catch (e) {
    return serverError(res, e);
  }
}

export async function wallet_topup_demo_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) {
      return serverError(res, "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q");
    }

    const auth = await getAuthedUser(req);
    if (!auth.ok) return json(res, auth.status, { ok: false, error: auth.message });

    const body = parseJsonBody(req);
    const amount_uzs = Math.round(Number(body.amount_uzs || 0));
    if (!Number.isFinite(amount_uzs) || amount_uzs <= 0) {
      return badRequest(res, "amount_uzs noto'g'ri");
    }

    const authedUserId = String(auth.user.id);
    const requestedUserId = String(body.user_id || '').trim();
    if (requestedUserId && requestedUserId !== authedUserId) {
      return json(res, 403, { ok: false, error: "Forbidden: boshqa user'ga topup qilolmaysiz" });
    }

    const user_id = requestedUserId || authedUserId;
    const rewardService = getRewardService(getSupabaseAdmin());
    const result = await rewardService.repositories.wallets.applyMutation({
      userId: user_id,
      amountUzs: amount_uzs,
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
        amount_uzs,
        kind: 'topup',
        direction: 'credit',
      },
    });
  } catch (e) {
    return serverError(res, e);
  }
}

export async function cashback_calc_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

    const body = parseJsonBody(req);
    const final_price_uzs = Number(body.final_price_uzs || 0);
    const service_type = String(body.service_type || 'standard').toLowerCase();

    if (!Number.isFinite(final_price_uzs) || final_price_uzs <= 0) {
      return badRequest(res, "final_price_uzs noto'g'ri");
    }

    let rate = 0.01;
    if (service_type === 'comfort') rate = 0.02;
    if (service_type === 'truck') rate = 0.0;

    return json(res, 200, { ok: true, cashback_uzs: Math.round(final_price_uzs * rate), rate });
  } catch (e) {
    return serverError(res, e);
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
  } catch (e) {
    return serverError(res, e);
  }
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });

  const rk = req.query?.routeKey || req.routeKey || '';

  switch (rk) {
    case 'wallet':
      return await wallet_balance_handler(req, res);
    case 'wallet-topup-demo':
      return await wallet_topup_demo_handler(req, res);
    case 'wallet-transactions':
      return await wallet_transactions_handler(req, res);
    case 'cashback-calc':
      return await cashback_calc_handler(req, res);
    case 'seat-hold-calc':
      return await seat_hold_quote_handler(req, res);
    default:
      return json(res, 404, { ok: false, error: 'wallet_route_not_found', routeKey: rk || null });
  }
}
