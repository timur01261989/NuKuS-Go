import { getSupabaseAdmin, getAuthedUser } from './supabase.js';

export const DEFAULT_REFERRAL_MIN_ORDER_UZS = 20000;
export const DEFAULT_REFERRAL_REWARD_UZS = 5000;
export const DEFAULT_FIRST_RIDE_REWARD_UZS = 10000;

export function normalizePhone(phone) {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  const digits = raw.replace(/\D+/g, '');
  if (!digits) return '';

  if (digits.startsWith('998') && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.length === 9) {
    return `+998${digits}`;
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `+998${digits.slice(1)}`;
  }

  return raw.startsWith('+') ? raw : `+${digits}`;
}

export function makeReferralCode(input) {
  const seed = String(input || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const prefix = seed.slice(0, 3) || 'UNI';
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${random}`.slice(0, 12);
}

export function getClientIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for'] || req?.headers?.['X-Forwarded-For'] || '';
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return String(req?.socket?.remoteAddress || req?.connection?.remoteAddress || '').trim();
}

export async function getAuthedContext(req) {
  const sb = getSupabaseAdmin();
  const user = await getAuthedUser(req, sb);
  return {
    sb,
    user,
    userId: user?.id || null,
    ipAddress: getClientIp(req),
  };
}

export async function getProfileByUserId(sb, userId) {
  if (!userId) return null;
  const { data, error } = await sb
    .from('profiles')
    .select('id,phone,phone_normalized,full_name,current_role,role,is_blocked,metadata')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

export async function getOrCreateReferralCode(sb, userId, phone = '') {
  const { data: existing, error: existingError } = await sb
    .from('referral_codes')
    .select('id,user_id,code,is_active,created_at,updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  const base = normalizePhone(phone).replace(/\D+/g, '').slice(-4);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = makeReferralCode(`${base}${attempt}`);
    const { data, error } = await sb
      .from('referral_codes')
      .insert({ user_id: userId, code, is_active: true })
      .select('id,user_id,code,is_active,created_at,updated_at')
      .single();

    if (!error) return data;
    if (!String(error.message || '').toLowerCase().includes('duplicate')) {
      throw error;
    }
  }

  throw new Error('Referral code yaratib bo\'lmadi');
}

export async function getReferralSummary(sb, userId) {
  const [codeResult, referralsResult, rewardsResult] = await Promise.all([
    sb
      .from('referral_codes')
      .select('id,user_id,code,is_active,created_at,updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
    sb
      .from('referrals')
      .select('id,status,referred_user_id,qualified_order_id,qualified_at,rewarded_at,created_at')
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
    sb
      .from('referral_rewards')
      .select('id,reward_user_id,reward_type,amount_uzs,created_at')
      .eq('reward_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  if (codeResult.error) throw codeResult.error;
  if (referralsResult.error) throw referralsResult.error;
  if (rewardsResult.error) throw rewardsResult.error;

  const referrals = referralsResult.data || [];
  const rewards = rewardsResult.data || [];

  return {
    code: codeResult.data || null,
    totals: {
      invited_count: referrals.length,
      qualified_count: referrals.filter((item) => item.status === 'qualified' || item.status === 'rewarded').length,
      rewarded_count: referrals.filter((item) => item.status === 'rewarded').length,
      earned_uzs: rewards.reduce((sum, item) => sum + Number(item.amount_uzs || 0), 0),
    },
    referrals,
    rewards,
  };
}

export async function getWallet(sb, userId) {
  const { data, error } = await sb
    .from('wallets')
    .select('user_id,balance_uzs,bonus_balance_uzs,reserved_uzs,total_topup_uzs,total_spent_uzs,total_earned_uzs,is_frozen,updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function upsertWalletBonus(sb, userId, amountUzs) {
  const wallet = await getWallet(sb, userId);
  const nextBonus = Number(wallet?.bonus_balance_uzs || 0) + Number(amountUzs || 0);
  const { error } = await sb
    .from('wallets')
    .upsert({
      user_id: userId,
      balance_uzs: Number(wallet?.balance_uzs || 0),
      bonus_balance_uzs: nextBonus,
      reserved_uzs: Number(wallet?.reserved_uzs || 0),
      total_topup_uzs: Number(wallet?.total_topup_uzs || 0),
      total_spent_uzs: Number(wallet?.total_spent_uzs || 0),
      total_earned_uzs: Number(wallet?.total_earned_uzs || 0) + Number(amountUzs || 0),
      is_frozen: Boolean(wallet?.is_frozen || false),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) throw error;
  return nextBonus;
}

export async function createWalletTransaction(sb, payload) {
  const insertPayload = {
    user_id: payload.user_id,
    direction: payload.direction || 'credit',
    kind: payload.kind || 'bonus',
    service_type: payload.service_type || null,
    amount_uzs: Math.round(Number(payload.amount_uzs || 0)),
    order_id: payload.order_id || null,
    ad_id: payload.ad_id || null,
    description: payload.description || null,
    metadata: payload.metadata || {},
    meta: payload.meta || payload.metadata || {},
  };

  const { data, error } = await sb
    .from('wallet_transactions')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function ensureReferralApplied(sb, {
  referrerUserId,
  referredUserId,
  referralCodeId,
  ipAddress = null,
  deviceHash = null,
}) {
  if (!referrerUserId || !referredUserId || !referralCodeId) {
    throw new Error('Referral yaratish uchun kerakli maydonlar yetarli emas');
  }

  if (String(referrerUserId) === String(referredUserId)) {
    throw new Error('O\'zingizni o\'zingiz taklif qila olmaysiz');
  }

  const { data: existing, error: existingError } = await sb
    .from('referrals')
    .select('*')
    .eq('referred_user_id', referredUserId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await sb
    .from('referrals')
    .insert({
      referrer_user_id: referrerUserId,
      referred_user_id: referredUserId,
      referral_code_id: referralCodeId,
      status: 'pending',
      ip_address: ipAddress,
      device_hash: deviceHash,
      fraud_score: 0,
      metadata: {},
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function logBonusEvent(sb, payload) {
  const { data, error } = await sb
    .from('bonus_events')
    .insert({
      event_type: payload.event_type,
      user_id: payload.user_id || null,
      related_user_id: payload.related_user_id || null,
      source_id: payload.source_id || null,
      source_type: payload.source_type || null,
      payload_json: payload.payload_json || {},
      status: payload.status || 'pending',
      attempt_count: payload.attempt_count || 0,
      last_error: payload.last_error || null,
      processed_at: payload.processed_at || null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getPromoCodeByCode(sb, code) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) return null;

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from('promo_codes')
    .select('*')
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export function calculatePromoDiscount(promo, orderTotalUzs) {
  const total = Math.max(0, Math.round(Number(orderTotalUzs || 0)));
  if (!promo || total <= 0) {
    return {
      discount_uzs: 0,
      final_total_uzs: total,
      applied: false,
    };
  }

  const minOrder = Math.max(0, Number(promo.min_order_amount_uzs || 0));
  if (total < minOrder) {
    return {
      discount_uzs: 0,
      final_total_uzs: total,
      applied: false,
      reason: 'minimum_order_not_met',
    };
  }

  let discount = 0;
  if (promo.discount_type === 'percent') {
    discount = Math.round((total * Number(promo.discount_value || 0)) / 100);
  } else {
    discount = Math.round(Number(promo.discount_value || 0));
  }

  const maxDiscount = Number(promo.max_discount_uzs || 0);
  if (maxDiscount > 0) {
    discount = Math.min(discount, maxDiscount);
  }

  discount = Math.max(0, Math.min(discount, total));

  return {
    discount_uzs: discount,
    final_total_uzs: total - discount,
    applied: discount > 0,
  };
}
