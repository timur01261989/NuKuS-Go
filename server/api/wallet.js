import { applyCors, json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';

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

/**
 * GET /api/wallet?routeKey=wallet
 * - Authorization: Bearer <access_token>  (required)
 * - Optional: user_id (if provided, must match authed user.id)
 */
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

    // Agar user_id yuborilgan bo'lsa, faqat o'zini ko'rsin
    if (requestedUserId && requestedUserId !== authedUserId) {
      return json(res, 403, { ok: false, error: "Forbidden: boshqa user wallet'ini ko'ra olmaysiz" });
    }

    const user_id = requestedUserId || authedUserId;

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('wallets')
      .select('user_id,balance_uzs,updated_at')
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) throw error;

    return json(res, 200, { ok: true, wallet: data || { user_id, balance_uzs: 0, updated_at: nowIso() } });
  } catch (e) {
    return serverError(res, e);
  }
}

/**
 * POST /api/wallet?routeKey=wallet-topup-demo
 * - Authorization: Bearer <access_token> (required)
 * body: { amount_uzs: number, user_id?: string }
 * - user_id optional: if provided must match authed user.id
 */
export async function wallet_topup_demo_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) {
      return serverError(res, "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q");
    }

    const auth = await getAuthedUser(req);
    if (!auth.ok) return json(res, auth.status, { ok: false, error: auth.message });

    // TUZATILDI: || operatorlari qo'shildi
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const amount_uzs = Number(body.amount_uzs || 0);

    if (!Number.isFinite(amount_uzs) || amount_uzs <= 0) {
      return badRequest(res, "amount_uzs noto'g'ri");
    }

    const authedUserId = String(auth.user.id);
    const requestedUserId = String(body.user_id || '').trim();

    if (requestedUserId && requestedUserId !== authedUserId) {
      return json(res, 403, { ok: false, error: "Forbidden: boshqa user'ga topup qilolmaysiz" });
    }

    const user_id = requestedUserId || authedUserId;

    const sb = getSupabaseAdmin();

    const { data: cur, error: ce } = await sb
      .from('wallets')
      .select('balance_uzs')
      .eq('user_id', user_id)
      .maybeSingle();
    if (ce) throw ce;

    const nextBal = Number(cur?.balance_uzs || 0) + Math.round(amount_uzs);

    const { error: we } = await sb
      .from('wallets')
      .upsert([{ user_id, balance_uzs: nextBal, updated_at: nowIso() }], { onConflict: 'user_id' });
    if (we) throw we;

    const { data: tx, error: te } = await sb
      .from('wallet_transactions')
      .insert([{ user_id, amount_uzs: Math.round(amount_uzs), kind: 'topup', meta: { demo: true } }])
      .select('*')
      .single();
    if (te) throw te;

    return json(res, 200, { ok: true, balance_uzs: nextBal, tx });
  } catch (e) {
    return serverError(res, e);
  }
}

/**
 * POST /api/wallet?routeKey=cashback-calc
 * body: { final_price_uzs: number, service_type?: string }
 * (auth talab qilmaydi — bu faqat kalkulyator)
 */
export async function cashback_calc_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

    // TUZATILDI: || operatorlari qo'shildi
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const seats = Math.max(1, Number(body.seats || 1));
    const seatPrice = Math.max(0, Number(body.seat_price_uzs || 0));
    const holdAmount = Math.round(seats * seatPrice);
    return json(res, 200, { ok: true, hold_amount_uzs: holdAmount, seats, seat_price_uzs: seatPrice });
  } catch (e) {
    return serverError(res, e);
  }
}

export default async function handler(req, res) {
  // CORS
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });

  // TUZATILDI: || operatorlari qo'shildi
  const rk = req.query?.routeKey || req.routeKey || '';

  switch (rk) {
    case 'wallet':
      return await wallet_balance_handler(req, res);
    case 'wallet-topup-demo':
      return await wallet_topup_demo_handler(req, res);
    case 'cashback-calc':
      return await cashback_calc_handler(req, res);
    case 'seat-hold-calc':
      return await seat_hold_quote_handler(req, res);
    default:
      // default: wallet balance
      return await wallet_balance_handler(req, res);
  }
}