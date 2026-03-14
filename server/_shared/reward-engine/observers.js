export class RewardObserver {
  async onEventCreated(_context) {}
  async onBeforeReward(_context) {}
  async onRewardIssued(_context) {}
  async onRewardSkipped(_context) {}
  async onEventCompleted(_context) {}
  async onEventFailed(_context) {}
}

export class RewardAuditObserver extends RewardObserver {
  async onEventCreated(context) {
    context.auditTrail.push({ stage: 'event_created', at: new Date().toISOString(), event_id: context.event?.id || null });
  }

  async onBeforeReward(context) {
    context.auditTrail.push({
      stage: 'before_reward',
      at: new Date().toISOString(),
      reward_type: context.currentReward?.rewardType || null,
      reward_key: context.currentReward?.rewardKey || null,
      user_id: context.currentReward?.userId || null,
      amount_uzs: context.currentReward?.amountUzs || 0,
    });
  }

  async onRewardIssued(context) {
    context.auditTrail.push({
      stage: 'reward_issued',
      at: new Date().toISOString(),
      reward_type: context.currentReward?.rewardType || null,
      reward_key: context.currentReward?.rewardKey || null,
      wallet_transaction_id: context.currentReward?.walletTransactionId || null,
    });
  }

  async onRewardSkipped(context) {
    context.auditTrail.push({
      stage: 'reward_skipped',
      at: new Date().toISOString(),
      reward_type: context.currentReward?.rewardType || null,
      reward_key: context.currentReward?.rewardKey || null,
      reason: context.currentReward?.skipReason || null,
    });
  }

  async onEventCompleted(context) {
    context.auditTrail.push({
      stage: 'event_completed',
      at: new Date().toISOString(),
      rewards_count: Array.isArray(context.rewards) ? context.rewards.length : 0,
    });
  }

  async onEventFailed(context) {
    context.auditTrail.push({
      stage: 'event_failed',
      at: new Date().toISOString(),
      error: String(context.error?.message || context.error || 'unknown_error'),
    });
  }
}

export class RewardMetricsObserver extends RewardObserver {
  async onEventCreated(context) {
    context.metrics.events_created += 1;
  }

  async onRewardIssued(context) {
    context.metrics.rewards_issued += 1;
    context.metrics.amount_issued_uzs += Number(context.currentReward?.amountUzs || 0);
  }

  async onRewardSkipped(context) {
    context.metrics.rewards_skipped += 1;
  }

  async onEventFailed(context) {
    context.metrics.events_failed += 1;
  }
}

export class ObserverBus {
  constructor(observers = []) {
    this.observers = Array.isArray(observers) ? observers : [];
  }

  async emit(hook, context) {
    for (const observer of this.observers) {
      const fn = observer?.[hook];
      if (typeof fn === 'function') {
        await fn.call(observer, context);
      }
    }
  }
}

export function createDefaultObserverBus() {
  return new ObserverBus([
    new RewardAuditObserver(),
    new RewardMetricsObserver(),
  ]);
}
