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

async function payment_create(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

    const auth = await getAuthedUser(req);
    if (!auth.ok) return json(res, auth.status, { ok: false, error: auth.message });

    const body = readBody(req);
    const amount_uzs = Number(body.amount_uzs || 0);
    const requested_provider = body.provider;
    const provider = selectPaymentProvider(requested_provider);

    if (!Number.isFinite(amount_uzs) || amount_uzs <= 0) return badRequest(res, 'amount_uzs noto\'g\'ri');

    const sb = getSupabaseAdmin();
    const user_id = String(auth.user.id);

    // DEMO provider: balansni darhol to'ldiradi (contract yo'q payme/click o'rniga vaqtincha)
    if (provider === 'demo') {
      if (!isDemoAllowed()) return badRequest(res, 'DEMO payment productionda o\'chiq (DISABLE_DEMO_PAYMENTS yoki ALLOW_DEMO_PAYMENTS_IN_PROD sozlamalarini tekshiring)');
      const credited = await creditWallet(sb, user_id, amount_uzs, { demo: true, service: 'auto_market' });
      return json(res, 200, { ok: true, provider, status: 'paid', ...credited });
    }

    // Real providers: invoice yozamiz va payment_url qaytaramiz.
    // NOTE: Payme/Click integratsiyasi uchun shartnoma + merchant cabinet kerak.
    // Bu skeleton: faqat env keylarni qo'yib deploy qiling, keyin callback verifikatsiyasini yoqasiz.
    const payment_id = crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const created_at = nowIso();

    const { error: ie } = await sb
      .from('auto_payments')
      .insert([
        {
          id: payment_id,
          user_id,
          provider,
          amount_uzs: Math.round(amount_uzs),
          status: 'pending',
          meta: { created_at, client: 'unigo', service: 'auto_market' },
        },
      ]);
    if (ie) throw ie;

    const appReturnUrl = String(body.return_url || '').trim();

    let payment_url = null;

    if (provider === 'payme') {
      const merchant = process.env.PAYME_MERCHANT_ID || '';
      // Payme checkout URL format depends on your cabinet config.
      // We return a placeholder URL with payment_id so you can wire it.
      payment_url = merchant
        ? `https://checkout.paycom.uz/${encodeURIComponent(merchant)}?account[payment_id]=${encodeURIComponent(payment_id)}&amount=${Math.round(amount_uzs) * 100}`
        : null;
    }

    if (provider === 'click') {
  if (!hasClickConfig()) return badRequest(res, 'CLICK sozlanmagan: CLICK_SERVICE_ID va CLICK_SECRET_KEY env ni qo\'ying');
  const serviceId = process.env.CLICK_SERVICE_ID;
  payment_url = `https://my.click.uz/services/pay?service_id=${encodeURIComponent(serviceId)}&merchant_trans_id=${encodeURIComponent(payment_id)}&amount=${encodeURIComponent(Math.round(amount_uzs))}`;
}


    // Optional: if you pass return_url, you can append it for your webview flow
    if (payment_url && appReturnUrl) {
      const sep = payment_url.includes('?') ? '&' : '?';
      payment_url = `${payment_url}${sep}return_url=${encodeURIComponent(appReturnUrl)}`;
    }

    return json(res, 200, {
      ok: true,
      provider,
      status: 'pending',
      payment_id,
      amount_uzs: Math.round(amount_uzs),
      payment_url,
      note: provider === 'payme' || provider === 'click'
        ? 'Provider integratsiyasi skeleton: callback verifikatsiyasini yoqish kerak (README_UZ ga qarang)'
        : null,
    });
  } catch (e) {
    return serverError(res, e);
  }
}

// Provider callback/webhook skeleton: mark as paid and credit wallet
async function payment_mark_paid(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) return serverError(res, "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q");

    const body = readBody(req);
    const payment_id = String(body.payment_id || '').trim();
    const provider = String(body.provider || '').trim().toLowerCase();
    const verified = !!body.verified; // IMPORTANT: real hayotda signature check shu yerda bo'ladi

    if (!payment_id) return badRequest(res, 'payment_id kerak');
    if (!verified) return json(res, 400, { ok: false, error: 'Not verified (callback signature tekshirilmagan)' });

    const sb = getSupabaseAdmin();
    const { data: pay, error: pe } = await sb
      .from('auto_payments')
      .select('*')
      .eq('id', payment_id)
      .maybeSingle();
    if (pe) throw pe;
    if (!pay) return json(res, 404, { ok: false, error: 'Payment not found' });
    if (pay.status === 'paid') return json(res, 200, { ok: true, status: 'paid', already: true });

    const { error: ue } = await sb
      .from('auto_payments')
      .update({ status: 'paid', paid_at: nowIso(), provider: provider || pay.provider })
      .eq('id', payment_id);
    if (ue) throw ue;

    const credited = await creditWallet(sb, String(pay.user_id), Number(pay.amount_uzs || 0), { provider: provider || pay.provider, payment_id, service: 'auto_market' });
    return json(res, 200, { ok: true, status: 'paid', ...credited });
  } catch (e) {
    return serverError(res, e);
  }
}

// Payme callback endpoint skeleton.
// Expected: Payme JSON-RPC. Biz JSON qabul qilamiz va payment_id ni ajratib olamiz.
async function payment_callback_payme(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) return serverError(res, "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q");

    const body = readBody(req);
    const v = verifyPaymeCallback(req, body);
    if (!v.ok) return json(res, 403, { ok: false, error: v.reason || 'Payme callback not verified' });

    // Common locations for payment_id
    const pid =
      body?.params?.account?.payment_id ||
      body?.account?.payment_id ||
      body?.payment_id ||
      body?.merchant_trans_id ||
      '';

    const payment_id = String(pid).trim();
    if (!payment_id) return badRequest(res, 'payment_id topilmadi (params.account.payment_id)');

    // Mark paid (requires verified=true)
    req.body = { payment_id, provider: 'payme', verified: true };
    return await payment_mark_paid(req, res);
  } catch (e) {
    return serverError(res, e);
  }
}

// Click callback endpoint skeleton.
// Expected: Click odatda form-urlencoded yuboradi. Biz parsed body bilan ishlaymiz.
async function payment_callback_click(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) return serverError(res, "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q");

    const body = readBody(req);
    const v = verifyClickCallback(req, body);
    if (!v.ok) return json(res, 403, { ok: false, error: v.reason || 'Click callback not verified' });

    const pid = body?.merchant_trans_id || body?.payment_id || '';
    const payment_id = String(pid).trim();
    if (!payment_id) return badRequest(res, 'merchant_trans_id (payment_id) kerak');

    req.body = { payment_id, provider: 'click', verified: true };
    return await payment_mark_paid(req, res);
  } catch (e) {
    return serverError(res, e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAID ACTIONS: promotions + contact reveal
// ─────────────────────────────────────────────────────────────────────────────

async function promo_buy(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const auth = await getAuthedUser(req);
    if (!auth.ok) return json(res, auth.status, { ok: false, error: auth.message });

    const body = readBody(req);
    const ad_id = String(body.ad_id || '').trim();
    const promo_type = String(body.promo_type || '').trim().toLowerCase();

    if (!ad_id) return badRequest(res, 'ad_id kerak');
    if (!promo_type) return badRequest(res, 'promo_type kerak');

    const pricing = getPricing();
    let price = null;
    let days = 0;
    let makeTop = false;

    if (promo_type === 'top_1day') { price = pricing.top_day; days = 1; makeTop = true; }
    if (promo_type === 'top_3day') { price = pricing.top_3day; days = 3; makeTop = true; }
    if (promo_type === 'vip_7day') { price = pricing.vip_7day; days = 7; }
    if (promo_type === 'raise') { price = pricing.raise; days = 0; }

    if (!price) return badRequest(res, 'promo_type noto\'g\'ri');

    const sb = getSupabaseAdmin();
    const user_id = String(auth.user.id);

    // Ad ownership check (faqat o'z e'loniga promo)
    const { data: ad, error: ae } = await sb
      .from('auto_ads')
      .select('id,user_id,is_top,status')
      .eq('id', ad_id)
      .maybeSingle();
    if (ae) throw ae;
    if (!ad) return json(res, 404, { ok: false, error: "E'lon topilmadi" });
    if (String(ad.user_id) !== user_id) return json(res, 403, { ok: false, error: "Faqat o'zingizning e'loningizga promo qilasiz" });

    // Charge wallet
    const charged = await debitWallet(sb, user_id, price, { service: 'auto_market', action: 'promo', promo_type, ad_id });
    if (!charged.ok) {
      return json(res, 402, { ok: false, error: 'Balans yetarli emas', balance_uzs: charged.balance_uzs, need_uzs: charged.need_uzs, require_topup: true });
    }

    const now = new Date();
    const expires_at = days > 0 ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString() : null;

    const { data: promo, error: pe } = await sb
      .from('auto_promotions')
      .insert([
        {
          user_id,
          ad_id,
          promo_type,
          price_uzs: Math.round(price),
          started_at: nowIso(),
          expires_at,
          status: 'active',
        },
      ])
      .select('*')
      .single();
    if (pe) throw pe;

    if (makeTop) {
      await sb.from('auto_ads').update({ is_top: true, updated_at: nowIso() }).eq('id', ad_id);
    }

    if (promo_type === 'raise') {
      // raise: updated_at ni yangilab ro'yxatda yuqoriga chiqarsin
      await sb.from('auto_ads').update({ updated_at: nowIso() }).eq('id', ad_id);
    }

    return json(res, 200, { ok: true, promo, balance_uzs: charged.balance_uzs });
  } catch (e) {
    return serverError(res, e);
  }
}

async function contact_reveal(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const auth = await getAuthedUser(req);
    if (!auth.ok) return json(res, auth.status, { ok: false, error: auth.message });

    const body = readBody(req);
    const ad_id = String(body.ad_id || '').trim();
    if (!ad_id) return badRequest(res, 'ad_id kerak');

    const sb = getSupabaseAdmin();
    const user_id = String(auth.user.id);

    const { data: ad, error: ae } = await sb
      .from('auto_ads')
      .select('id,user_id,seller_phone,status')
      .eq('id', ad_id)
      .maybeSingle();
    if (ae) throw ae;
    if (!ad) return json(res, 404, { ok: false, error: "E'lon topilmadi" });

    // Owner: free
    if (String(ad.user_id) === user_id) {
      return json(res, 200, { ok: true, phone: ad.seller_phone || null, price_uzs: 0, owner: true });
    }

    // Already revealed?
    const { data: existing, error: ee } = await sb
      .from('auto_contact_reveals')
      .select('id,created_at')
      .eq('user_id', user_id)
      .eq('ad_id', ad_id)
      .maybeSingle();
    if (ee) throw ee;
    if (existing) {
      return json(res, 200, { ok: true, phone: ad.seller_phone || null, price_uzs: 0, already: true });
    }

    const pricing = getPricing();
    const price = pricing.reveal;

    const charged = await debitWallet(sb, user_id, price, { service: 'auto_market', action: 'reveal_phone', ad_id });
    if (!charged.ok) {
      return json(res, 402, { ok: false, error: 'Balans yetarli emas', balance_uzs: charged.balance_uzs, need_uzs: charged.need_uzs, require_topup: true });
    }

    const { error: re } = await sb
      .from('auto_contact_reveals')
      .insert([{ user_id, ad_id, price_uzs: Math.round(price), created_at: nowIso() }]);
    if (re) throw re;

    return json(res, 200, { ok: true, phone: ad.seller_phone || null, price_uzs: Math.round(price), balance_uzs: charged.balance_uzs });
  } catch (e) {
    return serverError(res, e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cron: expire promos -> unset is_top
// ─────────────────────────────────────────────────────────────────────────────
async function cron_cleanup(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) return serverError(res, "SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server env'da yo'q");

    // Basic shared secret to avoid public abuse
    const secret = process.env.AUTO_MARKET_CRON_SECRET || '';
    const got = String(req.headers?.['x-cron-secret'] || '').trim();
    if (secret && got !== secret) return json(res, 403, { ok: false, error: 'Forbidden' });

    const sb = getSupabaseAdmin();
    const now = nowIso();

    // Mark expired promotions
    await sb
      .from('auto_promotions')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', now);

    // Unset is_top for ads without active TOP promos
    // NOTE: we only unset is_top if no active TOP promotion exists
    const { data: tops, error: te } = await sb
      .from('auto_promotions')
      .select('ad_id')
      .eq('status', 'active')
      .in('promo_type', ['top_1day', 'top_3day']);
    if (te) throw te;
    const topIds = new Set((tops || []).map((x) => String(x.ad_id)));

    // Fetch currently top ads
    const { data: topAds, error: ae } = await sb
      .from('auto_ads')
      .select('id')
      .eq('is_top', true);
    if (ae) throw ae;

    const toUnset = (topAds || []).map((x) => String(x.id)).filter((id) => !topIds.has(id));
    if (toUnset.length) {
      await sb.from('auto_ads').update({ is_top: false, updated_at: now }).in('id', toUnset);
    }

    return json(res, 200, { ok: true, expired_checked: true, unset_count: toUnset.length });
  } catch (e) {
    return serverError(res, e);
  }
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });

  // api/index.js sets req.routeKey
  const rk = String(req.query?.routeKey || req.routeKey || '').toLowerCase();
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/^\/api\/?/, '');

  // Support subpaths: /api/auto-market/payment/create
  const parts = path.split('/').filter(Boolean); // [auto-market, payment, create]
  const sub1 = parts[1] || '';
  const sub2 = parts[2] || '';

  if (rk === 'auto-market-payment' || sub1 === 'payment') {
    if (sub2 === 'create') return await payment_create(req, res);
    if (sub2 === 'callback') {
      const sub3 = parts[3] || ''; // payme|click
      if (sub3 === 'payme') return await payment_callback_payme(req, res);
      if (sub3 === 'click') return await payment_callback_click(req, res);
      return json(res, 404, { ok: false, error: 'Unknown callback provider' });
    }
    if (sub2 === 'mark-paid') return await payment_mark_paid(req, res);
    // default
    return await payment_create(req, res);
  }

  if (rk === 'auto-market-promo' || sub1 === 'promo') {
    if (sub2 === 'buy') return await promo_buy(req, res);
    return await promo_buy(req, res);
  }

  if (rk === 'auto-market-contact' || sub1 === 'contact') {
    if (sub2 === 'reveal') return await contact_reveal(req, res);
    return await contact_reveal(req, res);
  }

  if (rk === 'auto-market-cron' || sub1 === 'cron') {
    if (sub2 === 'cleanup') return await cron_cleanup(req, res);
    return await cron_cleanup(req, res);
  }

  return json(res, 404, { ok: false, error: 'Unknown auto-market route' });
}
