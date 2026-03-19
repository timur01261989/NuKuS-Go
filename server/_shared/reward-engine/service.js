import {
  COMPLETED_STATUSES_BY_SOURCE,
  DEFAULT_REWARD_CONFIG,
  REWARD_EVENT_TYPES,
  REWARD_TYPES,
  SERVICE_SOURCE_TABLES,
  WALLET_TX_KINDS,
  safeIsoNow,
  toPositiveMoney,
} from './constants.js';
import {
  buildRepositories,
  buildRewardKey,
  buildRewardMetadata,
} from './repositories.js';
import { createDefaultObserverBus } from './observers.js';
import { compareUsageAgainstLimit, createBaseContext } from './service.helpers.js';

export class RewardService {
  constructor(sb, options = {}) {
    this.sb = sb;
    this.config = {
      ...DEFAULT_REWARD_CONFIG,
      ...(options.config || {}),
    };
    this.repositories = options.repositories || buildRepositories(sb);
    this.observers = options.observers || createDefaultObserverBus();
  }

  getCompletedStatusesForSource(sourceTable = SERVICE_SOURCE_TABLES.ORDERS) {
    return COMPLETED_STATUSES_BY_SOURCE[sourceTable] || ['completed'];
  }

  async getServiceOrderBySource({ sourceTable = SERVICE_SOURCE_TABLES.ORDERS, sourceId }) {
    return this.repositories.serviceOrders.getBySource({ sourceTable, sourceId });
  }

  async issueWalletReward({
    userId,
    amountUzs,
    rewardType,
    txKind,
    rewardKey,
    orderId = null,
    sourceTable = null,
    serviceType = null,
    description,
    campaignId = null,
    referralId = null,
    promoCodeId = null,
    extraMetadata = {},
  }, context) {
    const amount = toPositiveMoney(amountUzs);
    if (amount <= 0) {
      context.currentReward = {
        userId,
        amountUzs: amount,
        rewardType,
        rewardKey,
        skipReason: 'zero_amount',
      };
      await this.observers.emit('onRewardSkipped', context);
      return null;
    }

    context.currentReward = {
      userId,
      amountUzs: amount,
      rewardType,
      rewardKey,
    };
    await this.observers.emit('onBeforeReward', context);

    const lock = await this.repositories.rewardLocks.acquire({
      rewardKey,
      rewardType,
      sourceId: orderId,
      metadata: buildRewardMetadata({
        rewardKey,
        rewardType,
        sourceTable,
        campaignId,
        referralId,
        promoCodeId,
        extra: extraMetadata,
      }),
    });

    if (!lock?.acquired) {
      context.currentReward.skipReason = 'reward_lock_exists';
      await this.observers.emit('onRewardSkipped', context);
      return null;
    }

    const walletMutation = await this.repositories.wallets.applyMutation({
      userId,
      amountUzs: amount,
      balanceField: 'bonus_balance_uzs',
      direction: 'credit',
      txKind,
      description,
      orderId,
      serviceType,
      metadata: buildRewardMetadata({
        rewardKey,
        rewardType,
        sourceTable,
        campaignId,
        referralId,
        promoCodeId,
        extra: extraMetadata,
      }),
    });

    context.currentReward.walletTransactionId = walletMutation?.wallet_transaction_id || null;
    context.rewards.push({
      reward_type: rewardType,
      tx_kind: txKind,
      amount_uzs: amount,
      user_id: userId,
      reward_key: rewardKey,
      wallet_transaction_id: walletMutation?.wallet_transaction_id || null,
      balance_snapshot: walletMutation?.wallet || null,
    });
    await this.observers.emit('onRewardIssued', context);

    return walletMutation;
  }

  async applyReferral({ referrerUserId, referredUserId, referralCodeId, ipAddress = null, deviceHash = null }) {
    if (!referrerUserId || !referredUserId || !referralCodeId) {
      throw new Error('referral input incomplete');
    }
    if (String(referrerUserId) === String(referredUserId)) {
      throw new Error('self referral is forbidden');
    }

    if (deviceHash) {
      await this.repositories.fraud.ensureFingerprint(referredUserId, deviceHash);
    }

    const existing = await this.repositories.referrals.getReferralForReferredUser(referredUserId);
    if (existing) {
      return existing;
    }

    const fraudSnapshot = await this.repositories.fraud.getUserFraudSnapshot(referredUserId, deviceHash);
    if (fraudSnapshot.blocked) {
      return this.repositories.referrals.createPendingReferral({
        referrerUserId,
        referredUserId,
        referralCodeId,
        ipAddress,
        deviceHash,
        fraudScore: fraudSnapshot.riskScore,
        metadata: {
          fraud_blocked: true,
          fraud_flags: fraudSnapshot.flags.map((item) => item.flag_code),
          device_reuse_count: fraudSnapshot.deviceReuseCount,
        },
      });
    }

    return this.repositories.referrals.createPendingReferral({
      referrerUserId,
      referredUserId,
      referralCodeId,
      ipAddress,
      deviceHash,
      fraudScore: fraudSnapshot.riskScore,
      metadata: {
        fraud_blocked: false,
        device_reuse_count: fraudSnapshot.deviceReuseCount,
      },
    });
  }

  async getOrCreateReferralCode(userId, seedText = '', options = {}) {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) {
      throw new Error('referral code userId required');
    }

    const existing = await this.repositories.referrals.getCodeByUserId(normalizedUserId);
    if (existing?.code) return existing;

    if (options?.authUser) {
      await this.repositories.profiles.ensureProfile(options.authUser);
      const afterBootstrap = await this.repositories.referrals.getCodeByUserId(normalizedUserId);
      if (afterBootstrap?.code) return afterBootstrap;
    }

    const userSeed = normalizedUserId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const baseSeed = String(seedText || userSeed || 'UNI')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(-6) || 'UNI';
    const suffixSeed = userSeed.slice(-4) || Math.random().toString(36).slice(2, 6).toUpperCase();

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const randomChunk = Math.random().toString(36).slice(2, 6).toUpperCase();
      const code = `${baseSeed}${suffixSeed}${randomChunk}`.slice(0, 12);
      try {
        const created = await this.repositories.referrals.createCode(normalizedUserId, code);
        if (created?.code) return created;
      } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        if (message.includes('profiles') || message.includes('foreign key')) {
          if (options?.authUser) {
            await this.repositories.profiles.ensureProfile(options.authUser);
            const retryExisting = await this.repositories.referrals.getCodeByUserId(normalizedUserId);
            if (retryExisting?.code) return retryExisting;
            continue;
          }
          throw error;
        }
        if (message.includes('duplicate') || message.includes('unique')) {
          const retryExisting = await this.repositories.referrals.getCodeByUserId(normalizedUserId);
          if (retryExisting?.code) return retryExisting;
          continue;
        }
        throw error;
      }
    }

    const finalExisting = await this.repositories.referrals.getCodeByUserId(normalizedUserId);
    if (finalExisting?.code) return finalExisting;
    throw new Error('referral code generation failed');
  }

  calculatePromoDiscount(promo, orderTotalUzs) {
    const total = toPositiveMoney(orderTotalUzs);
    if (!promo || total <= 0) {
      return {
        applied: false,
        discount_uzs: 0,
        final_total_uzs: total,
      };
    }

    const minOrder = toPositiveMoney(promo.min_order_amount_uzs);
    if (total < minOrder) {
      return {
        applied: false,
        reason: 'minimum_order_not_met',
        discount_uzs: 0,
        final_total_uzs: total,
      };
    }

    let discount = 0;
    if (String(promo.discount_type || '').toLowerCase() === 'percent') {
      discount = Math.round((total * Number(promo.discount_value || 0)) / 100);
    } else {
      discount = Math.round(Number(promo.discount_value || 0));
    }

    const maxDiscount = toPositiveMoney(promo.max_discount_uzs);
    if (maxDiscount > 0) {
      discount = Math.min(discount, maxDiscount);
    }

    discount = Math.max(0, Math.min(discount, total));

    return {
      applied: discount > 0,
      discount_uzs: discount,
      final_total_uzs: total - discount,
    };
  }

  async validatePromo({ userId, code, orderTotalUzs }) {
    const promo = await this.repositories.promos.getPromoByCode(code);
    if (!promo) {
      return { ok: false, error: 'Promo code topilmadi yoki faol emas' };
    }

    const profile = await this.repositories.profiles.getByUserId(userId);
    if (profile?.is_test_user) {
      return { ok: false, error: 'Test akkauntlarda promo ishlamaydi' };
    }

    const [totalUsed, usedByUser] = await Promise.all([
      this.repositories.promos.countRedemptions({ promoCodeId: promo.id }),
      this.repositories.promos.countRedemptions({ promoCodeId: promo.id, userId }),
    ]);

    if (compareUsageAgainstLimit(totalUsed, promo.usage_limit_total)) {
      return { ok: false, error: 'Promo limiti tugagan' };
    }
    if (compareUsageAgainstLimit(usedByUser, promo.usage_limit_per_user)) {
      return { ok: false, error: 'Siz promo limitidan foydalangan bo\'lgansiz' };
    }

    const discountResult = this.calculatePromoDiscount(promo, orderTotalUzs);
    if (!discountResult.applied) {
      return {
        ok: false,
        error: discountResult.reason === 'minimum_order_not_met'
          ? `Minimal buyurtma summasi ${promo.min_order_amount_uzs} so'm`
          : 'Promo ishlamadi',
      };
    }

    return {
      ok: true,
      promo,
      ...discountResult,
    };
  }

  async processCompletedServiceOrder(serviceOrder) {
    if (!serviceOrder?.source_id || !serviceOrder?.user_id) {
      throw new Error('Completed service order ma\'lumotlari yetarli emas');
    }

    const completedStatuses = this.getCompletedStatusesForSource(serviceOrder.source_table);
    const currentStatus = String(serviceOrder.status || '').toLowerCase();
    if (!completedStatuses.includes(currentStatus)) {
      return { processed: false, rewards: [], reason: 'status_not_completed' };
    }

    const context = createBaseContext({ config: this.config });
    context.event = await this.repositories.rewardEvents.create({
      eventType: REWARD_EVENT_TYPES.ORDER_COMPLETED,
      userId: serviceOrder.user_id,
      relatedUserId: serviceOrder.driver_user_id,
      sourceId: serviceOrder.source_id,
      sourceType: serviceOrder.source_table,
      payloadJson: {
        service_type: serviceOrder.service_type,
        amount_uzs: serviceOrder.amount_uzs,
        status: serviceOrder.status,
      },
      status: 'processing',
      attemptCount: 1,
    });
    await this.observers.emit('onEventCreated', context);

    try {
      const profile = await this.repositories.profiles.getByUserId(serviceOrder.user_id);
      if (profile?.is_test_user) {
        await this.repositories.rewardEvents.markDone(context.event.id, { last_error: 'test_user_rewards_skipped' });
        await this.observers.emit('onEventCompleted', context);
        return { processed: true, rewards: [], skipped: 'test_user', audit_trail: context.auditTrail, metrics: context.metrics };
      }

      const completedCount = await this.repositories.serviceOrders.countCompletedUserOrders(serviceOrder.user_id);
      if (completedCount === 1) {
        await this.issueWalletReward({
          userId: serviceOrder.user_id,
          amountUzs: this.config.firstRideRewardUzs,
          rewardType: REWARD_TYPES.FIRST_RIDE,
          txKind: WALLET_TX_KINDS.BONUS,
          rewardKey: buildRewardKey('reward', REWARD_TYPES.FIRST_RIDE, serviceOrder.user_id),
          orderId: serviceOrder.source_id,
          sourceTable: serviceOrder.source_table,
          serviceType: serviceOrder.service_type,
          description: 'First completed service bonus',
        }, context);
      }

      await this.issueCampaignRewards(serviceOrder, context);
      await this.processReferralQualification(serviceOrder, context);

      await this.repositories.rewardEvents.markDone(context.event.id);
      await this.observers.emit('onEventCompleted', context);
      return {
        processed: true,
        rewards: context.rewards,
        audit_trail: context.auditTrail,
        metrics: context.metrics,
      };
    } catch (error) {
      context.error = error;
      await this.repositories.rewardEvents.markFailed(context.event.id, error?.message || error, 1);
      await this.observers.emit('onEventFailed', context);
      throw error;
    }
  }

  async issueCampaignRewards(serviceOrder, context) {
    const campaigns = await this.repositories.campaigns.listActiveRulesByTrigger(
      REWARD_EVENT_TYPES.ORDER_COMPLETED,
      'client',
      serviceOrder.service_type,
      serviceOrder.amount_uzs,
    );

    for (const campaign of campaigns) {
      const usage = await this.repositories.campaigns.getUsage(serviceOrder.user_id, campaign.id);
      if (compareUsageAgainstLimit(usage?.times_used, campaign.usage_limit_per_user)) {
        context.currentReward = {
          userId: serviceOrder.user_id,
          amountUzs: 0,
          rewardType: REWARD_TYPES.CAMPAIGN,
          rewardKey: buildRewardKey('reward', 'campaign_limit', campaign.id, serviceOrder.user_id),
          skipReason: 'campaign_usage_limit_reached',
        };
        await this.observers.emit('onRewardSkipped', context);
        continue;
      }

      let amountUzs = toPositiveMoney(campaign.reward_amount_uzs);
      if (!amountUzs && String(campaign.reward_type || '').toLowerCase() === 'percentage') {
        amountUzs = Math.round(toPositiveMoney(serviceOrder.amount_uzs) * Number(campaign.reward_percent || 0) / 100);
      }

      const txKind = String(campaign.campaign_type || '').toLowerCase() === 'referral'
        ? WALLET_TX_KINDS.REFERRAL_BONUS
        : WALLET_TX_KINDS.BONUS;

      const mutation = await this.issueWalletReward({
        userId: serviceOrder.user_id,
        amountUzs,
        rewardType: REWARD_TYPES.CAMPAIGN,
        txKind,
        rewardKey: buildRewardKey('reward', 'campaign', campaign.id, serviceOrder.user_id, serviceOrder.source_id),
        orderId: serviceOrder.source_id,
        sourceTable: serviceOrder.source_table,
        serviceType: serviceOrder.service_type,
        description: `Campaign bonus: ${campaign.name}`,
        campaignId: campaign.id,
      }, context);

      if (mutation) {
        await this.repositories.campaigns.bumpUsage(serviceOrder.user_id, campaign.id);
      }
    }
  }

  async processReferralQualification(serviceOrder, context) {
    const referral = await this.repositories.referrals.getReferralForReferredUser(serviceOrder.user_id);
    if (!referral) return;
    if (!['pending', 'qualified'].includes(String(referral.status || '').toLowerCase())) return;
    if (toPositiveMoney(serviceOrder.amount_uzs) < this.config.referralMinOrderUzs) return;

    const fraudSnapshot = await this.repositories.fraud.getUserFraudSnapshot(
      referral.referred_user_id,
      referral.device_hash || null,
    );
    if (Boolean(referral.metadata?.fraud_blocked) || fraudSnapshot.blocked) {
      await this.repositories.referrals.updateReferral(referral.id, {
        status: 'rejected',
        rejection_reason: 'fraud_blocked',
        qualified_order_id: serviceOrder.source_id,
        qualified_at: referral.qualified_at || safeIsoNow(),
        metadata: {
          ...(referral.metadata || {}),
          fraud_blocked: true,
          fraud_flags: fraudSnapshot.flags.map((item) => item.flag_code),
          fraud_score_at_qualification: fraudSnapshot.riskScore,
          device_reuse_count_at_qualification: fraudSnapshot.deviceReuseCount,
          qualified_source_table: serviceOrder.source_table,
          qualified_order_amount_uzs: serviceOrder.amount_uzs,
        },
      });
      context.currentReward = {
        userId: referral.referred_user_id,
        amountUzs: 0,
        rewardType: REWARD_TYPES.REFERRAL_REFERRED,
        rewardKey: buildRewardKey('reward', 'referral', referral.id, 'fraud_blocked'),
        skipReason: 'fraud_blocked',
      };
      await this.observers.emit('onRewardSkipped', context);
      return;
    }

    const referredProfile = await this.repositories.profiles.getByUserId(referral.referred_user_id);
    const referrerProfile = await this.repositories.profiles.getByUserId(referral.referrer_user_id);
    if (referredProfile?.is_test_user || referrerProfile?.is_test_user) {
      await this.repositories.referrals.updateReferral(referral.id, {
        status: 'qualified',
        qualified_order_id: serviceOrder.source_id,
        qualified_at: referral.qualified_at || safeIsoNow(),
        metadata: {
          ...(referral.metadata || {}),
          skipped_reason: 'test_user',
          qualified_source_table: serviceOrder.source_table,
          qualified_order_amount_uzs: serviceOrder.amount_uzs,
        },
      });
      return;
    }

    const referredReward = await this.issueWalletReward({
      userId: referral.referred_user_id,
      amountUzs: this.config.referralRewardUzs,
      rewardType: REWARD_TYPES.REFERRAL_REFERRED,
      txKind: WALLET_TX_KINDS.REFERRAL_BONUS,
      rewardKey: buildRewardKey('reward', 'referral', referral.id, 'referred'),
      orderId: serviceOrder.source_id,
      sourceTable: serviceOrder.source_table,
      serviceType: serviceOrder.service_type,
      description: 'Referral bonus for referred user',
      referralId: referral.id,
    }, context);

    if (referredReward?.wallet_transaction_id) {
      await this.repositories.referrals.createReferralReward({
        referralId: referral.id,
        rewardUserId: referral.referred_user_id,
        rewardType: 'referred',
        amountUzs: this.config.referralRewardUzs,
        walletTransactionId: referredReward.wallet_transaction_id,
        metadata: {
          order_id: serviceOrder.source_id,
          source_table: serviceOrder.source_table,
        },
      });
    }

    const referrerReward = await this.issueWalletReward({
      userId: referral.referrer_user_id,
      amountUzs: this.config.referralRewardUzs,
      rewardType: REWARD_TYPES.REFERRAL_REFERRER,
      txKind: WALLET_TX_KINDS.REFERRAL_BONUS,
      rewardKey: buildRewardKey('reward', 'referral', referral.id, 'referrer'),
      orderId: serviceOrder.source_id,
      sourceTable: serviceOrder.source_table,
      serviceType: serviceOrder.service_type,
      description: 'Referral bonus for inviter',
      referralId: referral.id,
    }, context);

    if (referrerReward?.wallet_transaction_id) {
      await this.repositories.referrals.createReferralReward({
        referralId: referral.id,
        rewardUserId: referral.referrer_user_id,
        rewardType: 'referrer',
        amountUzs: this.config.referralRewardUzs,
        walletTransactionId: referrerReward.wallet_transaction_id,
        metadata: {
          order_id: serviceOrder.source_id,
          source_table: serviceOrder.source_table,
        },
      });
    }

    const rewarded = Boolean(referredReward || referrerReward);
    await this.repositories.referrals.updateReferral(referral.id, {
      status: rewarded ? 'rewarded' : 'qualified',
      qualified_order_id: serviceOrder.source_id,
      qualified_at: referral.qualified_at || safeIsoNow(),
      rewarded_at: rewarded ? safeIsoNow() : referral.rewarded_at,
      metadata: {
        ...(referral.metadata || {}),
        qualified_source_table: serviceOrder.source_table,
        qualified_order_amount_uzs: serviceOrder.amount_uzs,
      },
    });
  }
}

export function createRewardService(sb, options = {}) {
  return new RewardService(sb, options);
}
