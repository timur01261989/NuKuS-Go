import { nowIso } from '../cors.js';
import { getRewardService } from '../reward-engine/factory.js';

async function settleWalletPayment(rewardService, serviceOrder) {
  if (!serviceOrder?.user_id || !serviceOrder?.driver_user_id) {
    return { settled: false, reason: 'missing_party' };
  }

  if (String(serviceOrder.payment_method || 'cash').toLowerCase() !== 'wallet') {
    return { settled: false, reason: 'not_wallet_payment' };
  }

  const totalAmount = Math.max(0, Math.round(Number(serviceOrder.amount_uzs || 0)));
  if (totalAmount <= 0) return { settled: false, reason: 'empty_amount' };

  const paymentExists = await rewardService.repositories.wallets.hasTransaction({
    userId: serviceOrder.user_id,
    orderId: serviceOrder.source_id,
    txKind: 'order_payment',
  });
  if (paymentExists) {
    return { settled: false, reason: 'already_settled' };
  }

  const clientWallet = await rewardService.repositories.wallets.ensureWallet(serviceOrder.user_id);
  const bonusAvailable = Math.max(0, Number(clientWallet?.bonus_balance_uzs || 0));
  const cashAvailable = Math.max(0, Number(clientWallet?.balance_uzs || 0));
  const bonusUsed = Math.min(bonusAvailable, totalAmount);
  const cashUsed = totalAmount - bonusUsed;

  if (cashAvailable < cashUsed) {
    throw new Error('Wallet mablag\'i yetarli emas');
  }

  if (bonusUsed > 0) {
    await rewardService.repositories.wallets.applyMutation({
      userId: serviceOrder.user_id,
      amountUzs: bonusUsed,
      balanceField: 'bonus_balance_uzs',
      direction: 'debit',
      txKind: 'spend',
      description: 'Bonus balance spent for service payment',
      orderId: serviceOrder.source_id,
      serviceType: serviceOrder.service_type,
      metadata: {
        source_table: serviceOrder.source_table,
        payment_bucket: 'bonus_balance_uzs',
      },
    });
  }

  if (cashUsed > 0) {
    await rewardService.repositories.wallets.applyMutation({
      userId: serviceOrder.user_id,
      amountUzs: cashUsed,
      balanceField: 'balance_uzs',
      direction: 'debit',
      txKind: 'order_payment',
      description: 'Wallet payment for completed service',
      orderId: serviceOrder.source_id,
      serviceType: serviceOrder.service_type,
      metadata: {
        source_table: serviceOrder.source_table,
        payment_bucket: 'balance_uzs',
      },
    });
  }

  const commission = Math.max(0, Math.round(Number(serviceOrder.commission_uzs || 0)));
  const payout = Math.max(0, Math.round(Number(serviceOrder.driver_payout_uzs || 0) || (totalAmount - commission)));
  if (payout > 0) {
    const payoutExists = await rewardService.repositories.wallets.hasTransaction({
      userId: serviceOrder.driver_user_id,
      orderId: serviceOrder.source_id,
      txKind: 'order_payout',
    });

    if (!payoutExists) {
      await rewardService.repositories.wallets.applyMutation({
        userId: serviceOrder.driver_user_id,
        amountUzs: payout,
        balanceField: 'balance_uzs',
        direction: 'credit',
        txKind: 'order_payout',
        description: 'Driver payout for completed service',
        orderId: serviceOrder.source_id,
        serviceType: serviceOrder.service_type,
        metadata: {
          source_table: serviceOrder.source_table,
        },
      });
    }
  }

  return {
    settled: true,
    bonus_used_uzs: bonusUsed,
    cash_used_uzs: cashUsed,
    payout_uzs: payout,
  };
}

async function finalizePromoRedemption(rewardService, serviceOrder) {
  if (serviceOrder.source_table !== 'orders') return { finalized: false, reason: 'unsupported_source' };
  const redemption = await rewardService.repositories.promos.getRedemptionByOrderId(serviceOrder.source_id);
  if (!redemption || redemption.status !== 'applied') return { finalized: false, reason: 'missing_redemption' };

  await rewardService.repositories.promos.updateRedemption(redemption.id, {
    metadata: {
      ...(redemption.metadata || {}),
      finalized_at: nowIso(),
      source_table: serviceOrder.source_table,
      service_type: serviceOrder.service_type,
    },
  });

  return { finalized: true, redemption_id: redemption.id };
}

async function revertPromoRedemption(rewardService, serviceOrder) {
  if (serviceOrder.source_table !== 'orders') return { reverted: false, reason: 'unsupported_source' };
  const redemption = await rewardService.repositories.promos.getRedemptionByOrderId(serviceOrder.source_id);
  if (!redemption || redemption.status === 'reverted') {
    return { reverted: false, reason: 'missing_or_already_reverted' };
  }

  await rewardService.repositories.promos.updateRedemption(redemption.id, {
    status: 'reverted',
    metadata: {
      ...(redemption.metadata || {}),
      reverted_at: nowIso(),
      revert_reason: 'order_cancelled',
    },
  });

  const originalTotal = Number(redemption.metadata?.original_order_total_uzs || 0);
  if (originalTotal > 0) {
    const currentMeta = serviceOrder.raw?.route_meta || {};
    const nextPromoMeta = {
      ...(currentMeta?.promo || {}),
      reverted_at: nowIso(),
      redemption_status: 'reverted',
    };
    await rewardService.repositories.serviceOrders.updateOrderPromoState({
      orderId: serviceOrder.source_id,
      nextPriceUzs: originalTotal,
      routeMeta: {
        ...currentMeta,
        promo: nextPromoMeta,
      },
    });
  }

  return { reverted: true, redemption_id: redemption.id };
}

export async function processCompletionPipeline(sb, { sourceTable = 'orders', sourceId }) {
  const rewardService = getRewardService(sb);
  const serviceOrder = await rewardService.getServiceOrderBySource({ sourceTable, sourceId });
  if (!serviceOrder) throw new Error('Service order topilmadi');

  const settlement = await settleWalletPayment(rewardService, serviceOrder);
  const promo = await finalizePromoRedemption(rewardService, serviceOrder);
  const rewards = await rewardService.processCompletedServiceOrder(serviceOrder);

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
  const rewardService = getRewardService(sb);
  const serviceOrder = await rewardService.getServiceOrderBySource({ sourceTable, sourceId });
  if (!serviceOrder) throw new Error('Service order topilmadi');

  const promo = await revertPromoRedemption(rewardService, serviceOrder);
  return {
    ok: true,
    source_table: sourceTable,
    source_id: sourceId,
    promo,
  };
}
