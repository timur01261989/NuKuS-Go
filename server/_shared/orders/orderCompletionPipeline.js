import { createWalletTransaction } from '../rewards.js';
import { getServiceOrderBySource, processCompletedServiceOrder } from '../rewardEngine.js';

function nowIso() {
  return new Date().toISOString();
}

async function ensureWallet(sb, uid) {
  if (!uid) return null;
  const { data, error } = await sb.from('wallets').select('*').eq('user_id', uid).maybeSingle();
  if (error) throw error;
  if (data) return data;
  const { data: created, error: createError } = await sb
    .from('wallets')
    .insert([{ user_id: uid }])
    .select('*')
    .single();
  if (createError) throw createError;
  return created;
}

async function updateWalletBalances(sb, userId, patch) {
  if (!userId) return;
  const wallet = await ensureWallet(sb, userId);
  const next = {
    balance_uzs: Number(wallet?.balance_uzs || 0),
    bonus_balance_uzs: Number(wallet?.bonus_balance_uzs || 0),
    reserved_uzs: Number(wallet?.reserved_uzs || 0),
    total_topup_uzs: Number(wallet?.total_topup_uzs || 0),
    total_spent_uzs: Number(wallet?.total_spent_uzs || 0),
    total_earned_uzs: Number(wallet?.total_earned_uzs || 0),
    is_frozen: Boolean(wallet?.is_frozen || false),
    updated_at: nowIso(),
    ...patch,
  };
  const { error } = await sb.from('wallets').upsert({ user_id: userId, ...next }, { onConflict: 'user_id' });
  if (error) throw error;
}

async function hasWalletTx(sb, { userId, orderId, kind, sourceTable }) {
  const { data, error } = await sb
    .from('wallet_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('order_id', orderId)
    .eq('kind', kind)
    .contains('metadata', { source_table: sourceTable })
    .limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

async function settleWalletPayment(sb, serviceOrder) {
  if (!serviceOrder?.user_id || !serviceOrder?.driver_user_id) {
    return { settled: false, reason: 'missing_party' };
  }

  if (String(serviceOrder.payment_method || 'cash').toLowerCase() !== 'wallet') {
    return { settled: false, reason: 'not_wallet_payment' };
  }

  const totalAmount = Math.max(0, Math.round(Number(serviceOrder.amount_uzs || 0)));
  if (totalAmount <= 0) return { settled: false, reason: 'empty_amount' };

  if (await hasWalletTx(sb, { userId: serviceOrder.user_id, orderId: serviceOrder.source_id, kind: 'order_payment', sourceTable: serviceOrder.source_table })) {
    return { settled: false, reason: 'already_settled' };
  }

  const clientWallet = await ensureWallet(sb, serviceOrder.user_id);
  const bonusAvailable = Math.max(0, Number(clientWallet?.bonus_balance_uzs || 0));
  const cashAvailable = Math.max(0, Number(clientWallet?.balance_uzs || 0));
  const bonusUsed = Math.min(bonusAvailable, totalAmount);
  const cashUsed = totalAmount - bonusUsed;

  if (cashAvailable < cashUsed) {
    throw new Error('Wallet mablag\'i yetarli emas');
  }

  if (bonusUsed > 0) {
    await updateWalletBalances(sb, serviceOrder.user_id, {
      balance_uzs: cashAvailable,
      bonus_balance_uzs: bonusAvailable - bonusUsed,
      total_spent_uzs: Number(clientWallet?.total_spent_uzs || 0) + bonusUsed,
    });
    await createWalletTransaction(sb, {
      user_id: serviceOrder.user_id,
      direction: 'debit',
      kind: 'spend',
      amount_uzs: bonusUsed,
      order_id: serviceOrder.source_id,
      description: 'Bonus balance spent for service payment',
      metadata: { source_table: serviceOrder.source_table, payment_bucket: 'bonus_balance_uzs' },
    });
  }

  if (cashUsed > 0) {
    await updateWalletBalances(sb, serviceOrder.user_id, {
      balance_uzs: cashAvailable - cashUsed,
      bonus_balance_uzs: bonusAvailable - bonusUsed,
      total_spent_uzs: Number(clientWallet?.total_spent_uzs || 0) + totalAmount,
    });
    await createWalletTransaction(sb, {
      user_id: serviceOrder.user_id,
      direction: 'debit',
      kind: 'order_payment',
      amount_uzs: cashUsed,
      order_id: serviceOrder.source_id,
      description: 'Wallet payment for completed service',
      metadata: { source_table: serviceOrder.source_table, payment_bucket: 'balance_uzs' },
    });
  }

  const driverWallet = await ensureWallet(sb, serviceOrder.driver_user_id);
  const commission = Math.max(0, Math.round(Number(serviceOrder.commission_uzs || 0)));
  const payout = Math.max(0, Math.round(Number(serviceOrder.driver_payout_uzs || 0) || (totalAmount - commission)));

  if (payout > 0 && !(await hasWalletTx(sb, { userId: serviceOrder.driver_user_id, orderId: serviceOrder.source_id, kind: 'order_payout', sourceTable: serviceOrder.source_table }))) {
    await updateWalletBalances(sb, serviceOrder.driver_user_id, {
      balance_uzs: Number(driverWallet?.balance_uzs || 0) + payout,
      total_earned_uzs: Number(driverWallet?.total_earned_uzs || 0) + payout,
    });
    await createWalletTransaction(sb, {
      user_id: serviceOrder.driver_user_id,
      direction: 'credit',
      kind: 'order_payout',
      amount_uzs: payout,
      order_id: serviceOrder.source_id,
      description: 'Driver payout for completed service',
      metadata: { source_table: serviceOrder.source_table },
    });
  }

  return { settled: true, bonus_used_uzs: bonusUsed, cash_used_uzs: cashUsed, payout_uzs: payout };
}

async function finalizePromoRedemption(sb, serviceOrder) {
  if (serviceOrder.source_table !== 'orders') return { finalized: false, reason: 'unsupported_source' };

  const { data: redemption, error } = await sb
    .from('promo_redemptions')
    .select('*')
    .eq('order_id', serviceOrder.source_id)
    .maybeSingle();
  if (error) throw error;
  if (!redemption || redemption.status !== 'applied') return { finalized: false, reason: 'missing_redemption' };

  const { error: updateError } = await sb
    .from('promo_redemptions')
    .update({
      metadata: {
        ...(redemption.metadata || {}),
        finalized_at: nowIso(),
        source_table: serviceOrder.source_table,
        service_type: serviceOrder.service_type,
      },
    })
    .eq('id', redemption.id);
  if (updateError) throw updateError;
  return { finalized: true, redemption_id: redemption.id };
}

async function revertPromoRedemption(sb, serviceOrder) {
  if (serviceOrder.source_table !== 'orders') return { reverted: false, reason: 'unsupported_source' };

  const { data: redemption, error } = await sb
    .from('promo_redemptions')
    .select('*')
    .eq('order_id', serviceOrder.source_id)
    .maybeSingle();
  if (error) throw error;
  if (!redemption || redemption.status === 'reverted') return { reverted: false, reason: 'missing_or_already_reverted' };

  const { error: updateError } = await sb
    .from('promo_redemptions')
    .update({
      status: 'reverted',
      metadata: {
        ...(redemption.metadata || {}),
        reverted_at: nowIso(),
        revert_reason: 'order_cancelled',
      },
    })
    .eq('id', redemption.id);
  if (updateError) throw updateError;

  const originalTotal = Number(redemption.metadata?.original_order_total_uzs || 0);
  if (originalTotal > 0) {
    const currentMeta = serviceOrder.raw?.route_meta || {};
    const nextPromoMeta = {
      ...(currentMeta?.promo || {}),
      reverted_at: nowIso(),
      redemption_status: 'reverted',
    };
    const { error: orderUpdateError } = await sb
      .from('orders')
      .update({
        price_uzs: originalTotal,
        route_meta: { ...currentMeta, promo: nextPromoMeta },
        updated_at: nowIso(),
      })
      .eq('id', serviceOrder.source_id);
    if (orderUpdateError) throw orderUpdateError;
  }

  return { reverted: true, redemption_id: redemption.id };
}

export async function processCompletionPipeline(sb, { sourceTable = 'orders', sourceId }) {
  const serviceOrder = await getServiceOrderBySource(sb, { sourceTable, sourceId });
  if (!serviceOrder) throw new Error('Service order topilmadi');

  const settlement = await settleWalletPayment(sb, serviceOrder);
  const promo = await finalizePromoRedemption(sb, serviceOrder);
  const rewards = await processCompletedServiceOrder(sb, serviceOrder);

  return {
    ok: true,
    source_table: sourceTable,
    source_id: sourceId,
    settlement,
    promo,
    rewards,
  };
}

export async function processCancellationPipeline(sb, { sourceTable = 'orders', sourceId }) {
  const serviceOrder = await getServiceOrderBySource(sb, { sourceTable, sourceId });
  if (!serviceOrder) throw new Error('Service order topilmadi');
  const promo = await revertPromoRedemption(sb, serviceOrder);
  return {
    ok: true,
    source_table: sourceTable,
    source_id: sourceId,
    promo,
  };
}
