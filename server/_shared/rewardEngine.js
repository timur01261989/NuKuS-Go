import { getRewardService } from './reward-engine/factory.js';
import {
  COMPLETED_STATUSES_BY_SOURCE,
  SERVICE_SOURCE_TABLES,
} from './reward-engine/constants.js';

export function getCompletedStatusesForSource(sourceTable = SERVICE_SOURCE_TABLES.ORDERS) {
  return COMPLETED_STATUSES_BY_SOURCE[sourceTable] || ['completed'];
}

export async function getServiceOrderBySource(sb, { sourceTable = SERVICE_SOURCE_TABLES.ORDERS, sourceId }) {
  return getRewardService(sb).getServiceOrderBySource({ sourceTable, sourceId });
}

export async function processCompletedServiceOrder(sb, serviceOrder) {
  return getRewardService(sb).processCompletedServiceOrder(serviceOrder);
}

export async function ensureRewardLock(sb, rewardKey, rewardType, sourceId, metadata = {}) {
  return getRewardService(sb).repositories.rewardLocks.acquire({
    rewardKey,
    rewardType,
    sourceId,
    metadata,
  });
}

export async function countCompletedServiceOrders(sb, userId) {
  return getRewardService(sb).repositories.serviceOrders.countCompletedUserOrders(userId);
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
  const service = getRewardService(sb);
  const context = {
    config: service.config,
    event: null,
    rewards: [],
    auditTrail: [],
    metrics: {
      events_created: 0,
      events_failed: 0,
      rewards_issued: 0,
      rewards_skipped: 0,
      amount_issued_uzs: 0,
    },
    currentReward: null,
    error: null,
  };

  const result = await service.issueWalletReward({
    userId,
    amountUzs,
    rewardType,
    txKind: 'bonus',
    rewardKey: String(metadata?.reward_key || `${rewardType}:${userId}:${orderId || 'na'}`),
    orderId,
    sourceTable,
    description,
    extraMetadata: metadata || {},
  }, context);

  return {
    nextBonus: result?.wallet?.bonus_balance_uzs ?? null,
    tx: result
      ? {
          id: result.wallet_transaction_id,
          metadata: result.metadata || metadata || {},
        }
      : null,
  };
}

export async function markBonusEventDone(sb, eventId, patch = {}) {
  return getRewardService(sb).repositories.rewardEvents.markDone(eventId, patch);
}

export async function markBonusEventFailed(sb, eventId, errorMessage, attemptCount = 1) {
  return getRewardService(sb).repositories.rewardEvents.markFailed(eventId, errorMessage, attemptCount);
}
