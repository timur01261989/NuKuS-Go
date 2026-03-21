import { applyCors, json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';
import crypto from 'crypto';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
function envTrue(name, def = false) {
  const v = process.env[name];
  if (v === undefined) return def;
  return String(v).toLowerCase() === 'true' || v === '1';
}

function hasPaymeConfig() {
  return !!(process.env.PAYME_MERCHANT_ID && process.env.PAYME_SECRET);
}

function hasClickConfig() {
  return !!(process.env.CLICK_SERVICE_ID && process.env.CLICK_SECRET_KEY);
}

function isDemoAllowed() {
  // Safety switch: NEVER leave demo enabled in production unless you explicitly allow it.
  if (envTrue('DISABLE_DEMO_PAYMENTS', false)) return false;
  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production' && !envTrue('ALLOW_DEMO_PAYMENTS_IN_PROD', false)) return false;
  return true;
}

function selectPaymentProvider(requested) {
  const r = String(requested || 'auto').toLowerCase();
  if (r === 'payme' || r === 'click' || r === 'demo') return r;
  // auto:
  if (hasPaymeConfig()) return 'payme';
  if (hasClickConfig()) return 'click';
  return 'demo';
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider callback skeletons (Payme / Click)
//
// Goal:
//   - Hozir DEMO bilan flow'ni test qilasiz
//   - Keyin Payme/Click shartnoma bo'lganda faqat ENV keylarini qo'yib yoqasiz
//   - Callback/signature tekshiruvini keyin shu joyga qo'shasiz
//
// Safety:
//   Callback endpointlar default OFF.
//   Yoqish uchun:
//     ENABLE_PAYME_CALLBACK=true yoki ENABLE_CLICK_CALLBACK=true
// ─────────────────────────────────────────────────────────────────────────────

function callbackEnabled(provider) {
  if (provider === 'payme') return envTrue('ENABLE_PAYME_CALLBACK', false);
  if (provider === 'click') return envTrue('ENABLE_CLICK_CALLBACK', false);
  return false;
}

function allowDirectMarkPaid() {
  return envTrue('ALLOW_AUTO_MARKET_DIRECT_MARK_PAID', false);
}

// NOTE: Bu verify funksiyalar ATAYLAB skeleton.
// Shartnoma + provider hujjati bo'lgandan keyin to'liq signature/credential
// tekshiruvini shu yerga qo'shasiz.
function verifyPaymeCallback(req, body) {
  if (!callbackEnabled('payme')) return { ok: false, reason: 'Payme callback disabled' };
  if (!hasPaymeConfig()) return { ok: false, reason: 'Payme env not configured' };

  // TODO (Payme JSON-RPC):
  // 1) Authorization header (Basic) ni tekshirish
  // 2) JSON-RPC methodlarini handle qilish
  // 3) params.account.payment_id dan payment_id olish
  // 4) amount (tiyin) ni tekshirish
  // 5) idempotency: transaction id ni saqlash

  // Placeholder: Basic header borligini tekshiramiz (siz keyin to'liq tekshirasiz)
  const authHeader = String(req.headers?.authorization || req.headers?.Authorization || '');
  if (!authHeader) return { ok: false, reason: 'Missing Authorization header' };
  return { ok: true };
}

function verifyClickCallback(req, body) {
  if (!callbackEnabled('click')) return { ok: false, reason: 'Click callback disabled' };
  if (!hasClickConfig()) return { ok: false, reason: 'Click env not configured' };

  // TODO (Click):
  // 1) sign-string tuzish (provider hujjatiga ko'ra)
  // 2) md5(signature_string) tekshirish
  // 3) merchant_trans_id => payment_id
  // 4) idempotency: click_trans_id ni saqlash

  return { ok: true };
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

  if (!hasSupabaseEnv()) return { ok: false, status: 500, message: "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q" };

  const sb = getSupabaseAdmin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return { ok: false, status: 401, message: 'Invalid token' };
  return { ok: true, user: data.user, token };
}

function readBody(req) {
  try {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return {};
  }
}

function envNumber(name, fallback) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function getPricing() {
  // NOTE: pricing server-side bo'lishi shart (client manipulyatsiya qilmasin)
  // You can override via env vars.
  const reveal = envNumber('AUTO_MARKET_REVEAL_PHONE_PRICE_UZS', 5000);
  const top_day = envNumber('AUTO_MARKET_TOP_1DAY_PRICE_UZS', 15000);
  const top_3day = envNumber('AUTO_MARKET_TOP_3DAY_PRICE_UZS', 35000);
  const vip_7day = envNumber('AUTO_MARKET_VIP_7DAY_PRICE_UZS', 50000);
  const raise = envNumber('AUTO_MARKET_RAISE_PRICE_UZS', 8000);
  return { reveal, top_day, top_3day, vip_7day, raise };
}

async function getWalletBalance(sb, user_id) {
  const { data, error } = await sb
    .from('wallets')
    .select('user_id,balance_uzs')
    .eq('user_id', user_id)
    .maybeSingle();
  if (error) throw error;
  return Number(data?.balance_uzs || 0);
}

async function creditWallet(sb, user_id, amount_uzs, meta = {}) {
  const cur = await getWalletBalance(sb, user_id);
  const nextBal = cur + Math.round(amount_uzs);

  const { error: we } = await sb
    .from('wallets')
    .upsert([{ user_id, balance_uzs: nextBal, updated_at: nowIso() }], { onConflict: 'user_id' });
  if (we) throw we;

  const { data: tx, error: te } = await sb
    .from('wallet_transactions')
    .insert([{ user_id, amount_uzs: Math.round(amount_uzs), kind: 'topup', meta }])
    .select('*')
    .single();
  if (te) throw te;

  return { balance_uzs: nextBal, tx };
}

async function debitWallet(sb, user_id, amount_uzs, meta = {}) {
  const cur = await getWalletBalance(sb, user_id);
  const need = Math.round(amount_uzs);
  if (cur < need) {
    return { ok: false, balance_uzs: cur, need_uzs: need, error: 'Not enough balance' };
  }

  const nextBal = cur - need;
  const { error: we } = await sb
    .from('wallets')
    .upsert([{ user_id, balance_uzs: nextBal, updated_at: nowIso() }], { onConflict: 'user_id' });
  if (we) throw we;

  const { data: tx, error: te } = await sb
    .from('wallet_transactions')
    .insert([{ user_id, amount_uzs: -need, kind: 'spend', meta }])
    .select('*')
    .single();
  if (te) throw te;

  return { ok: true, balance_uzs: nextBal, tx };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT (Top-up)
// ─────────────────────────────────────────────────────────────────────────────

