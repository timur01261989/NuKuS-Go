export const REWARD_EVENT_TYPES = Object.freeze({
  ORDER_COMPLETED: 'order.completed',
  REFERRAL_APPLIED: 'referral.applied',
  PROMO_APPLIED: 'promo.applied',
  DRIVER_ACTIVATED: 'driver.activated',
});

export const REWARD_TYPES = Object.freeze({
  FIRST_RIDE: 'first_ride_bonus',
  REFERRAL_REFERRER: 'referral_referrer_bonus',
  REFERRAL_REFERRED: 'referral_referred_bonus',
  DRIVER_ACTIVATION: 'driver_activation_bonus',
  DRIVER_REFERRAL_MILESTONE: 'driver_referral_milestone_bonus',
  CAMPAIGN: 'campaign_bonus',
  PROMO: 'promo_bonus',
  WALLET_SPEND: 'wallet_spend',
  ORDER_PAYMENT: 'order_payment',
  ORDER_PAYOUT: 'order_payout',
});

export const WALLET_TX_KINDS = Object.freeze({
  TOPUP: 'topup',
  WITHDRAW: 'withdraw',
  ORDER_PAYMENT: 'order_payment',
  ORDER_PAYOUT: 'order_payout',
  COMMISSION: 'commission',
  REFUND: 'refund',
  AD_FEE: 'ad_fee',
  MANUAL_ADJUSTMENT: 'manual_adjustment',
  SPEND: 'spend',
  BONUS: 'bonus',
  REFERRAL_BONUS: 'referral_bonus',
  PROMO_BONUS: 'promo_bonus',
  MISSION_BONUS: 'mission_bonus',
  LOYALTY_BONUS: 'loyalty_bonus',
});

export const SERVICE_SOURCE_TABLES = Object.freeze({
  ORDERS: 'orders',
  DELIVERY_ORDERS: 'delivery_orders',
  CARGO_ORDERS: 'cargo_orders',
  INTERPROV_TRIPS: 'interprov_trips',
  DISTRICT_TRIPS: 'district_trips',
});

export const SERVICE_TYPES = Object.freeze({
  TAXI: 'taxi',
  DELIVERY: 'delivery',
  CARGO: 'cargo',
  INTERPROV: 'interprov',
  DISTRICT: 'district',
});

export const COMPLETED_STATUSES_BY_SOURCE = Object.freeze({
  [SERVICE_SOURCE_TABLES.ORDERS]: ['completed'],
  [SERVICE_SOURCE_TABLES.DELIVERY_ORDERS]: ['delivered'],
  [SERVICE_SOURCE_TABLES.CARGO_ORDERS]: ['delivered', 'closed'],
  [SERVICE_SOURCE_TABLES.INTERPROV_TRIPS]: ['completed', 'finished'],
  [SERVICE_SOURCE_TABLES.DISTRICT_TRIPS]: ['completed', 'finished'],
});

export const CANCELLED_STATUSES = Object.freeze([
  'cancelled',
  'cancelled_by_client',
  'cancelled_by_driver',
  'canceled',
]);

export const DEFAULT_REWARD_CONFIG = Object.freeze({
  firstRideRewardUzs: 10000,
  referralRewardUzs: 3000,
  referralMinOrderUzs: 20000,
  driverReferralMilestoneTrips: 5,
  driverReferralMilestoneRewardUzs: 10000,
  fraudBlockThreshold: 70,
});

export function toPositiveMoney(value) {
  const normalized = Math.round(Number(value || 0));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 0;
}

export function safeIsoNow() {
  return new Date().toISOString();
}

export function normalizeRewardKey(parts) {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(':');
}
