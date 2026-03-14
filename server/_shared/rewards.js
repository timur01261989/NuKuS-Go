import { getSupabaseAdmin, getAuthedUser } from './supabase.js';
import { getRewardService } from './reward-engine/factory.js';
import { REWARD_EVENT_TYPES } from './reward-engine/constants.js';

export const DEFAULT_REFERRAL_MIN_ORDER_UZS = 20000;
export const DEFAULT_REFERRAL_REWARD_UZS = 3000;
export const DEFAULT_FIRST_RIDE_REWARD_UZS = 10000;

export function normalizePhone(phone) {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  const digits = raw.replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('998') && digits.length === 12) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+998${digits.slice(1)}`;
  return raw.startsWith('+') ? raw : `+${digits}`;
}

export function makeReferralCode(input) {
  const seed = String(input || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const prefix = seed.slice(0, 4) || 'UNI';
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
  return getRewardService(sb).repositories.profiles.getByUserId(userId);
}

export async function getOrCreateReferralCode(sb, userId, phone = '') {
  const seed = normalizePhone(phone).replace(/\D+/g, '').slice(-6);
  return getRewardService(sb).getOrCreateReferralCode(userId, seed);
}

export async function getReferralSummary(sb, userId) {
  const service = getRewardService(sb);
  const code = await service.getOrCreateReferralCode(userId);
  const summary = await service.repositories.referrals.listSummary(userId);
  return {
    code,
    ...summary,
  };
}

export async function getWallet(sb, userId) {
  return getRewardService(sb).repositories.wallets.getWallet(userId);
}

export async function upsertWalletBonus(sb, userId, amountUzs) {
  const result = await getRewardService(sb).repositories.wallets.applyMutation({
    userId,
    amountUzs,
    balanceField: 'bonus_balance_uzs',
    direction: 'credit',
    txKind: 'bonus',
    description: 'Wallet bonus credit',
    metadata: { source: 'rewards.upsertWalletBonus' },
  });
  return Number(result?.wallet?.bonus_balance_uzs || 0);
}

export async function createWalletTransaction(sb, payload) {
  const result = await getRewardService(sb).repositories.wallets.applyMutation({
    userId: payload.user_id,
    amountUzs: payload.amount_uzs,
    balanceField: String(payload.metadata?.wallet_balance_type || payload.meta?.wallet_balance_type || 'balance_uzs') === 'bonus_balance_uzs' ? 'bonus_balance_uzs' : 'balance_uzs',
    direction: payload.direction || 'credit',
    txKind: payload.kind || 'manual_adjustment',
    description: payload.description || null,
    orderId: payload.order_id || null,
    serviceType: payload.service_type || null,
    metadata: payload.metadata || payload.meta || {},
  });
  return {
    id: result?.wallet_transaction_id || null,
    user_id: payload.user_id,
    direction: payload.direction || 'credit',
    kind: payload.kind || 'manual_adjustment',
    amount_uzs: Math.round(Number(payload.amount_uzs || 0)),
    order_id: payload.order_id || null,
    metadata: payload.metadata || payload.meta || {},
  };
}

export async function ensureReferralApplied(sb, {
  referrerUserId,
  referredUserId,
  referralCodeId,
  ipAddress = null,
  deviceHash = null,
}) {
  return getRewardService(sb).applyReferral({
    referrerUserId,
    referredUserId,
    referralCodeId,
    ipAddress,
    deviceHash,
  });
}

export async function logBonusEvent(sb, payload) {
  return getRewardService(sb).repositories.rewardEvents.create({
    eventType: payload.event_type || REWARD_EVENT_TYPES.ORDER_COMPLETED,
    userId: payload.user_id || null,
    relatedUserId: payload.related_user_id || null,
    sourceId: payload.source_id || null,
    sourceType: payload.source_type || null,
    payloadJson: payload.payload_json || {},
    status: payload.status || 'pending',
    attemptCount: payload.attempt_count || 0,
    lastError: payload.last_error || null,
  });
}

export async function getPromoCodeByCode(sb, code) {
  return getRewardService(sb).repositories.promos.getPromoByCode(code);
}

export function calculatePromoDiscount(promo, orderTotalUzs) {
  const total = Math.max(0, Math.round(Number(orderTotalUzs || 0)));
  if (!promo || total <= 0) {
    return { applied: false, discount_uzs: 0, final_total_uzs: total };
  }

  const minOrder = Math.max(0, Math.round(Number(promo.min_order_amount_uzs || 0)));
  if (total < minOrder) {
    return { applied: false, reason: 'minimum_order_not_met', discount_uzs: 0, final_total_uzs: total };
  }

  let discount = 0;
  if (String(promo.discount_type || '').toLowerCase() === 'percent') {
    discount = Math.round((total * Number(promo.discount_value || 0)) / 100);
  } else {
    discount = Math.round(Number(promo.discount_value || 0));
  }

  const maxDiscount = Math.max(0, Math.round(Number(promo.max_discount_uzs || 0)));
  if (maxDiscount > 0) discount = Math.min(discount, maxDiscount);
  discount = Math.max(0, Math.min(discount, total));
  return { applied: discount > 0, discount_uzs: discount, final_total_uzs: total - discount };
}
