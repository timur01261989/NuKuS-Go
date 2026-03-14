import {
  createWalletTransaction,
  DEFAULT_FIRST_RIDE_REWARD_UZS,
  DEFAULT_REFERRAL_MIN_ORDER_UZS,
  DEFAULT_REFERRAL_REWARD_UZS,
  getProfileByUserId,
  logBonusEvent,
  upsertWalletBonus,
} from './rewards.js';

const COMPLETED_STATUS_BY_SOURCE = {
  orders: ['completed'],
  delivery_orders: ['delivered'],
  cargo_orders: ['delivered', 'closed'],
};

export function getCompletedStatusesForSource(sourceTable = 'orders') {
  return COMPLETED_STATUS_BY_SOURCE[sourceTable] || ['completed'];
}

export async function getServiceOrderBySource(sb, { sourceTable = 'orders', sourceId }) {
  if (!sourceId) return null;

  if (sourceTable === 'orders') {
    const { data, error } = await sb
      .from('orders')
      .select('id,user_id,driver_id,service_type,status,payment_method,price_uzs,commission_uzs,driver_payout_uzs,completed_at,cancelled_at,created_at,updated_at,route_meta')
      .eq('id', sourceId)
      .maybeSingle();
    if (error) throw error;
    return data
      ? {
          source_table: 'orders',
          source_id: data.id,
          user_id: data.user_id,
          driver_user_id: data.driver_id,
          service_type: data.service_type || 'taxi',
          status: data.status,
          payment_method: data.payment_method || 'cash',
          amount_uzs: Number(data.price_uzs || 0),
          commission_uzs: Number(data.commission_uzs || 0),
          driver_payout_uzs: Number(data.driver_payout_uzs || 0),
          route_meta: data.route_meta || {},
          raw: data,
        }
      : null;
  }

  if (sourceTable === 'delivery_orders') {
    const { data, error } = await sb
      .from('delivery_orders')
      .select('id,user_id,driver_user_id,service_mode,status,payment_method,price,price_uzs,commission_amount,created_at,updated_at,history')
      .eq('id', sourceId)
      .maybeSingle();
    if (error) throw error;
    return data
      ? {
          source_table: 'delivery_orders',
          source_id: data.id,
          user_id: data.user_id,
          driver_user_id: data.driver_user_id,
          service_type: 'delivery',
          status: data.status,
          payment_method: data.payment_method || 'cash',
          amount_uzs: Number(data.price_uzs ?? data.price ?? 0),
          commission_uzs: Number(data.commission_amount || 0),
          driver_payout_uzs: 0,
          route_meta: { service_mode: data.service_mode || 'city', history: data.history || [] },
          raw: data,
        }
      : null;
  }

  if (sourceTable === 'cargo_orders') {
    const { data, error } = await sb
      .from('cargo_orders')
      .select('id,user_id,driver_user_id,status,price_uzs,budget,selected_offer_id,created_at,updated_at')
      .eq('id', sourceId)
      .maybeSingle();
    if (error) throw error;
    return data
      ? {
          source_table: 'cargo_orders',
          source_id: data.id,
          user_id: data.user_id,
          driver_user_id: data.driver_user_id,
          service_type: 'freight',
          status: data.status,
          payment_method: 'cash',
          amount_uzs: Number(data.price_uzs ?? data.budget ?? 0),
          commission_uzs: 0,
          driver_payout_uzs: 0,
          route_meta: { selected_offer_id: data.selected_offer_id || null },
          raw: data,
        }
      : null;
  }

  throw new Error(`Unsupported sourceTable: ${sourceTable}`);
}

export async function ensureRewardLock(sb, rewardKey, rewardType, sourceId, metadata = {}) {
  const { data: existing, error: existingError } = await sb
    .from('reward_locks')
    .select('id,reward_key,reward_type,source_id,metadata')
    .eq('reward_key', rewardKey)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return { created: false, row: existing };

  const { data, error } = await sb
    .from('reward_locks')
    .insert({ reward_key: rewardKey, reward_type: rewardType, source_id: sourceId, metadata })
    .select('*')
    .single();

  if (error) {
    if (String(error.message || '').toLowerCase().includes('duplicate')) {
      return { created: false, row: null };
    }
    throw error;
  }

  return { created: true, row: data };
}

export async function countCompletedServiceOrders(sb, userId) {
  const [orders, delivery, cargo] = await Promise.all([
    sb.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
    sb.from('delivery_orders').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'delivered'),
    sb.from('cargo_orders').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['delivered', 'closed']),
  ]);

  if (orders.error) throw orders.error;
  if (delivery.error) throw delivery.error;
  if (cargo.error) throw cargo.error;

  return Number(orders.count || 0) + Number(delivery.count || 0) + Number(cargo.count || 0);
}

export async function issueBonusReward(sb, {
  userId,
  amountUzs,
  description,
  orderId,
  rewardType,
  sourceTable,
  metadata,
}) {
  const nextBonus = await upsertWalletBonus(sb, userId, amountUzs);
  const tx = await createWalletTransaction(sb, {
    user_id: userId,
    direction: 'credit',
    kind: 'bonus',
    amount_uzs: amountUzs,
    order_id: orderId,
    description,
    metadata: {
      ...(metadata || {}),
      reward_type: rewardType,
      source_table: sourceTable,
      wallet_balance_type: 'bonus_balance_uzs',
    },
  });

  return { nextBonus, tx };
}

export async function markBonusEventDone(sb, eventId, patch = {}) {
  if (!eventId) return;
  const { error } = await sb
    .from('bonus_events')
    .update({
      status: 'done',
      processed_at: new Date().toISOString(),
      last_error: null,
      ...patch,
    })
    .eq('id', eventId);
  if (error) throw error;
}

export async function markBonusEventFailed(sb, eventId, errorMessage, attemptCount = 1) {
  if (!eventId) return;
  const { error } = await sb
    .from('bonus_events')
    .update({
      status: 'failed',
      processed_at: new Date().toISOString(),
      last_error: String(errorMessage || 'reward_engine_failed'),
      attempt_count: attemptCount,
    })
    .eq('id', eventId);
  if (error) throw error;
}

export async function processCompletedServiceOrder(sb, serviceOrder) {
  if (!serviceOrder?.source_id || !serviceOrder?.user_id) {
    throw new Error('Completed service order ma\'lumotlari yetarli emas');
  }

  const completedStatuses = getCompletedStatusesForSource(serviceOrder.source_table);
  if (!completedStatuses.includes(String(serviceOrder.status || '').toLowerCase())) {
    return { processed: false, rewards: [], reason: 'status_not_completed' };
  }

  const profile = await getProfileByUserId(sb, serviceOrder.user_id);
  const isTestUser = Boolean(profile?.metadata?.is_test_user || profile?.metadata?.test_user);
  const rewards = [];

  const event = await logBonusEvent(sb, {
    event_type: 'service.completed',
    user_id: serviceOrder.user_id,
    related_user_id: serviceOrder.driver_user_id,
    source_id: serviceOrder.source_id,
    source_type: serviceOrder.source_table,
    payload_json: {
      service_type: serviceOrder.service_type,
      amount_uzs: serviceOrder.amount_uzs,
      status: serviceOrder.status,
    },
    status: 'processing',
    attempt_count: 1,
  });

  try {
    if (isTestUser) {
      await markBonusEventDone(sb, event.id, {
        last_error: 'test_user_rewards_skipped',
      });
      return { processed: true, rewards: [], skipped: 'test_user' };
    }

    const completedCount = await countCompletedServiceOrders(sb, serviceOrder.user_id);
    if (completedCount === 1) {
      const firstRideLock = await ensureRewardLock(
        sb,
        `first_service_completion:${serviceOrder.user_id}`,
        'first_service_completion',
        serviceOrder.source_id,
        { source_table: serviceOrder.source_table }
      );
      if (firstRideLock.created) {
        const reward = await issueBonusReward(sb, {
          userId: serviceOrder.user_id,
          amountUzs: DEFAULT_FIRST_RIDE_REWARD_UZS,
          description: 'First completed service bonus',
          orderId: serviceOrder.source_id,
          rewardType: 'first_service_completion',
          sourceTable: serviceOrder.source_table,
          metadata: { source_table: serviceOrder.source_table },
        });
        rewards.push({ reward_type: 'first_service_completion', amount_uzs: DEFAULT_FIRST_RIDE_REWARD_UZS, tx: reward.tx });
      }
    }

    const { data: referral, error: referralError } = await sb
      .from('referrals')
      .select('*')
      .eq('referred_user_id', serviceOrder.user_id)
      .in('status', ['pending', 'qualified'])
      .maybeSingle();

    if (referralError) throw referralError;

    if (referral && Number(serviceOrder.amount_uzs || 0) >= DEFAULT_REFERRAL_MIN_ORDER_UZS) {
      const referredProfile = await getProfileByUserId(sb, referral.referred_user_id);
      const referrerProfile = await getProfileByUserId(sb, referral.referrer_user_id);
      const allowReferralRewards = !Boolean(referredProfile?.metadata?.is_test_user || referrerProfile?.metadata?.is_test_user);

      let referralRewarded = false;
      if (allowReferralRewards) {
        const referredLock = await ensureRewardLock(
          sb,
          `referral:${referral.id}:referred`,
          'referral_referred',
          serviceOrder.source_id,
          { source_table: serviceOrder.source_table }
        );
        const referrerLock = await ensureRewardLock(
          sb,
          `referral:${referral.id}:referrer`,
          'referral_referrer',
          serviceOrder.source_id,
          { source_table: serviceOrder.source_table }
        );

        if (referredLock.created) {
          const reward = await issueBonusReward(sb, {
            userId: referral.referred_user_id,
            amountUzs: DEFAULT_REFERRAL_REWARD_UZS,
            description: 'Referral bonus for referred user',
            orderId: serviceOrder.source_id,
            rewardType: 'referral_referred',
            sourceTable: serviceOrder.source_table,
            metadata: { referral_id: referral.id },
          });
          const { error } = await sb.from('referral_rewards').insert({
            referral_id: referral.id,
            reward_user_id: referral.referred_user_id,
            reward_type: 'referred',
            amount_uzs: DEFAULT_REFERRAL_REWARD_UZS,
            wallet_transaction_id: reward.tx.id,
            metadata: { order_id: serviceOrder.source_id, source_table: serviceOrder.source_table },
          });
          if (error) throw error;
          rewards.push({ reward_type: 'referral_referred', amount_uzs: DEFAULT_REFERRAL_REWARD_UZS, tx: reward.tx });
          referralRewarded = true;
        }

        if (referrerLock.created) {
          const reward = await issueBonusReward(sb, {
            userId: referral.referrer_user_id,
            amountUzs: DEFAULT_REFERRAL_REWARD_UZS,
            description: 'Referral bonus for inviter',
            orderId: serviceOrder.source_id,
            rewardType: 'referral_referrer',
            sourceTable: serviceOrder.source_table,
            metadata: { referral_id: referral.id },
          });
          const { error } = await sb.from('referral_rewards').insert({
            referral_id: referral.id,
            reward_user_id: referral.referrer_user_id,
            reward_type: 'referrer',
            amount_uzs: DEFAULT_REFERRAL_REWARD_UZS,
            wallet_transaction_id: reward.tx.id,
            metadata: { order_id: serviceOrder.source_id, source_table: serviceOrder.source_table },
          });
          if (error) throw error;
          rewards.push({ reward_type: 'referral_referrer', amount_uzs: DEFAULT_REFERRAL_REWARD_UZS, tx: reward.tx });
          referralRewarded = true;
        }
      }

      const { error: updateReferralError } = await sb
        .from('referrals')
        .update({
          status: referralRewarded ? 'rewarded' : 'qualified',
          qualified_order_id: serviceOrder.source_id,
          qualified_at: referral.qualified_at || new Date().toISOString(),
          rewarded_at: referralRewarded ? new Date().toISOString() : referral.rewarded_at,
          metadata: {
            ...(referral.metadata || {}),
            qualified_order_amount_uzs: serviceOrder.amount_uzs,
            qualified_source_table: serviceOrder.source_table,
          },
        })
        .eq('id', referral.id);
      if (updateReferralError) throw updateReferralError;
    }

    await markBonusEventDone(sb, event.id);
    return { processed: true, rewards };
  } catch (error) {
    await markBonusEventFailed(sb, event.id, error?.message || error, 1);
    throw error;
  }
}
