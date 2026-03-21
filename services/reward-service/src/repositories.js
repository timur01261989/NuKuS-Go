import {
  COMPLETED_STATUSES_BY_SOURCE,
  DEFAULT_REWARD_CONFIG,
  SERVICE_SOURCE_TABLES,
  SERVICE_TYPES,
  WALLET_TX_KINDS,
  normalizeRewardKey,
  safeIsoNow,
  toPositiveMoney,
} from './constants.js';
import {
  evaluateRule,
  isDuplicateError,
  mapUnifiedOrder,
  tryMaybeSingle,
} from './repositoryHelpers.js';

export class ProfileRepository {
  constructor(sb) {
    this.sb = sb;
  }

  async getByUserId(userId) {
    if (!userId) return null;

    const result = await tryMaybeSingle(this.sb, 'profiles', [
      'id,phone,phone_normalized,role,current_role,is_test_user,full_name,avatar_url',
      'id,phone,role,current_role,full_name,avatar_url',
      'id,phone,role,current_role',
      'id,phone,role',
      'id,phone',
    ], userId);

    if (result.error) throw result.error;
    return result.data
      ? {
          phone_normalized: null,
          role: 'client',
          current_role: 'client',
          is_test_user: false,
          full_name: null,
          avatar_url: null,
          ...result.data,
        }
      : null;
  }

  async ensureProfile(user) {
    const userId = String(user?.id || '').trim();
    if (!userId) return null;

    const existing = await this.getByUserId(userId);
    if (existing) return existing;

    const phone = String(user?.phone || user?.user_metadata?.phone || user?.raw_user_meta_data?.phone || '').trim() || null;

    const payload = {
      id: userId,
      phone,
      role: 'client',
      current_role: 'client',
    };

    const primaryResult = await this.sb
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (primaryResult.error && !isDuplicateError(primaryResult.error)) {
      const message = String(primaryResult.error?.message || '').toLowerCase();
      if (!message.includes('column')) {
        throw primaryResult.error;
      }

      const fallbackPayload = {
        id: userId,
        phone,
      };
      const fallbackResult = await this.sb
        .from('profiles')
        .upsert(fallbackPayload, { onConflict: 'id' });
      if (fallbackResult.error && !isDuplicateError(fallbackResult.error)) throw fallbackResult.error;
    }

    return await this.getByUserId(userId);
  }

  async isAdmin(userId) {
    if (!userId) return false;
    const { data, error } = await this.sb
      .from('profiles')
      .select('id,role,current_role')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return ['admin', 'super_admin'].includes(String(data?.role || '').toLowerCase()) || ['admin', 'super_admin'].includes(String(data?.current_role || '').toLowerCase());
  }
}

export class FraudRepository {
  constructor(sb) {
    this.sb = sb;
  }

  async getUserFraudSnapshot(userId, deviceHash = null) {
    if (!userId) {
      return {
        blocked: false,
        riskScore: 0,
        deviceReuseCount: 0,
        flags: [],
      };
    }

    const normalizedDeviceHash = String(deviceHash || '').trim() || null;
    const [flagRows, deviceRows] = await Promise.all([
      this.sb
        .from('fraud_flags')
        .select('id,user_id,flag_code,note,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      normalizedDeviceHash
        ? this.sb
            .from('device_fingerprints')
            .select('id,user_id,fingerprint,created_at')
            .eq('fingerprint', normalizedDeviceHash)
            .limit(20)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (flagRows.error) throw flagRows.error;
    if (deviceRows.error) throw deviceRows.error;

    const flags = flagRows.data || [];
    const deviceUsers = Array.from(new Set((deviceRows.data || []).map((row) => row.user_id).filter(Boolean)));
    const highRiskFlagCount = flags.filter((row) => ['blocked', 'referral_abuse', 'wallet_abuse', 'promo_abuse', 'multi_account'].includes(String(row.flag_code || '').toLowerCase())).length;
    const deviceReuseCount = Math.max(0, deviceUsers.length - 1);
    const riskScore = Math.min(100, highRiskFlagCount * 35 + deviceReuseCount * 20);

    return {
      blocked: riskScore >= DEFAULT_REWARD_CONFIG.fraudBlockThreshold,
      riskScore,
      deviceReuseCount,
      flags,
    };
  }

  async ensureFingerprint(userId, fingerprint) {
    const normalized = String(fingerprint || '').trim();
    if (!userId || !normalized) return null;

    const { data, error } = await this.sb
      .from('device_fingerprints')
      .insert({ user_id: userId, fingerprint: normalized })
      .select('id,user_id,fingerprint,created_at')
      .single();

    if (error && !isDuplicateError(error)) throw error;
    if (data) return data;

    const existing = await this.sb
      .from('device_fingerprints')
      .select('id,user_id,fingerprint,created_at')
      .eq('user_id', userId)
      .eq('fingerprint', normalized)
      .maybeSingle();
    if (existing.error) throw existing.error;
    return existing.data || null;
  }
}

export class WalletRepository {
  constructor(sb) {
    this.sb = sb;
  }

  async getWallet(userId) {
    if (!userId) return null;
    const { data, error } = await this.sb
      .from('wallets')
      .select('user_id,balance_uzs,bonus_balance_uzs,reserved_uzs,total_topup_uzs,total_spent_uzs,total_earned_uzs,is_frozen,updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async ensureWallet(userId) {
    const existing = await this.getWallet(userId);
    if (existing) return existing;

    const { data, error } = await this.sb
      .from('wallets')
      .insert({
        user_id: userId,
        balance_uzs: 0,
        bonus_balance_uzs: 0,
        reserved_uzs: 0,
        total_topup_uzs: 0,
        total_spent_uzs: 0,
        total_earned_uzs: 0,
        is_frozen: false,
      })
      .select('user_id,balance_uzs,bonus_balance_uzs,reserved_uzs,total_topup_uzs,total_spent_uzs,total_earned_uzs,is_frozen,updated_at')
      .single();
    if (error && !isDuplicateError(error)) throw error;
    if (data) return data;
    return await this.getWallet(userId);
  }

  async applyMutation({
    userId,
    amountUzs,
    balanceField,
    direction,
    txKind,
    description,
    orderId = null,
    serviceType = null,
    metadata = {},
  }) {
    const normalizedAmount = toPositiveMoney(amountUzs);
    if (!userId) throw new Error('wallet mutation userId required');
    if (normalizedAmount <= 0) throw new Error('wallet mutation amount must be positive');
    if (!['balance_uzs', 'bonus_balance_uzs'].includes(balanceField)) throw new Error('unsupported balance field');
    if (!['credit', 'debit'].includes(direction)) throw new Error('unsupported direction');

    const rpcPayload = {
      p_user_id: userId,
      p_balance_field: balanceField,
      p_direction: direction,
      p_amount_uzs: normalizedAmount,
      p_tx_kind: txKind,
      p_service_type: serviceType,
      p_order_id: orderId,
      p_description: description,
      p_metadata: metadata,
    };

    const { data, error } = await this.sb.rpc('wallet_apply_atomic', rpcPayload);
    if (error) throw error;
    return data;
  }

  async hasTransaction({ userId, orderId, txKind, rewardKey = null }) {
    if (!userId || !txKind) return false;
    let query = this.sb
      .from('wallet_transactions')
      .select('id,metadata')
      .eq('user_id', userId)
      .eq('kind', txKind)
      .limit(10);

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!rewardKey) return Boolean((data || []).length);
    return (data || []).some((row) => String(row.metadata?.reward_key || '') === String(rewardKey));
  }
}

export class RewardLockRepository {
  constructor(sb) {
    this.sb = sb;
  }

  async acquire({ rewardKey, rewardType, sourceId = null, metadata = {} }) {
    const normalizedKey = String(rewardKey || '').trim();
    if (!normalizedKey) throw new Error('reward_key required');

    const { data, error } = await this.sb.rpc('reward_lock_acquire', {
      p_reward_key: normalizedKey,
      p_reward_type: rewardType,
      p_source_id: sourceId,
      p_metadata: metadata,
    });

    if (error) throw error;
    return data;
  }
}

export class RewardEventRepository {
  constructor(sb) {
    this.sb = sb;
  }

  async create({
    eventType,
    userId = null,
    relatedUserId = null,
    sourceId = null,
    sourceType = null,
    payloadJson = {},
    status = 'pending',
    attemptCount = 0,
    lastError = null,
  }) {
    const { data, error } = await this.sb
      .from('bonus_events')
      .insert({
        event_type: eventType,
        user_id: userId,
        related_user_id: relatedUserId,
        source_id: sourceId,
        source_type: sourceType,
        payload_json: payloadJson,
        status,
        attempt_count: attemptCount,
        last_error: lastError,
      })
      .select('id,event_type,user_id,related_user_id,source_id,source_type,status,attempt_count,last_error,created_at,processed_at,payload_json')
      .single();
    if (error) throw error;
    return data;
  }

  async markDone(eventId, patch = {}) {
    if (!eventId) return null;
    const { data, error } = await this.sb
      .from('bonus_events')
      .update({
        status: 'done',
        processed_at: safeIsoNow(),
        last_error: null,
        ...patch,
      })
      .eq('id', eventId)
      .select('id,status,processed_at,last_error,attempt_count')
      .single();
    if (error) throw error;
    return data;
  }

  async markFailed(eventId, lastError, attemptCount = 1) {
    if (!eventId) return null;
    const { data, error } = await this.sb
      .from('bonus_events')
      .update({
        status: 'failed',
        processed_at: safeIsoNow(),
        last_error: String(lastError || 'reward_engine_failed'),
        attempt_count: attemptCount,
      })
      .eq('id', eventId)
      .select('id,status,processed_at,last_error,attempt_count')
      .single();
    if (error) throw error;
    return data;
  }
}

export class CampaignRepository {
  constructor(sb) {
    this.sb = sb;
  }

  async listActiveRulesByTrigger(triggerEvent, audienceType, serviceType, amountUzs) {
    const now = safeIsoNow();
    const { data, error } = await this.sb
      .from('bonus_campaigns')
      .select('id,name,campaign_type,audience_type,service_type,reward_type,reward_amount_uzs,reward_percent,max_discount_uzs,min_order_amount_uzs,usage_limit_total,usage_limit_per_user,stackable,priority,starts_at,ends_at,is_active,metadata')
      .eq('is_active', true)
      .or(`audience_type.eq.${audienceType},audience_type.eq.both`)
      .or(`service_type.is.null,service_type.eq.${serviceType}`)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('priority', { ascending: false });
    if (error) throw error;

    const campaigns = data || [];
    if (!campaigns.length) return [];

    const campaignIds = campaigns.map((item) => item.id);
    const { data: rules, error: rulesError } = await this.sb
      .from('bonus_rules')
      .select('id,campaign_id,trigger_event,condition_type,comparison_operator,condition_value,created_at')
      .eq('trigger_event', triggerEvent)
      .in('campaign_id', campaignIds);
    if (rulesError) throw rulesError;

    const rulesByCampaignId = new Map();
    for (const rule of rules || []) {
      const list = rulesByCampaignId.get(rule.campaign_id) || [];
      list.push(rule);
      rulesByCampaignId.set(rule.campaign_id, list);
    }

    return campaigns
      .map((campaign) => ({ ...campaign, rules: rulesByCampaignId.get(campaign.id) || [] }))
      .filter((campaign) => {
        if (toPositiveMoney(amountUzs) < toPositiveMoney(campaign.min_order_amount_uzs)) {
          return false;
        }
        if (!campaign.rules.length) {
          return ['first_ride', 'referral', 'promo'].includes(String(campaign.campaign_type || '').toLowerCase());
        }
        return campaign.rules.every((rule) => evaluateRule(rule, amountUzs));
      });
  }

  async getUsage(userId, campaignId) {
    const { data, error } = await this.sb
      .from('user_bonus_usages')
      .select('id,user_id,campaign_id,times_used,last_used_at,created_at,updated_at')
      .eq('user_id', userId)
      .eq('campaign_id', campaignId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async bumpUsage(userId, campaignId) {
    const existing = await this.getUsage(userId, campaignId);
    const nextTimesUsed = Number(existing?.times_used || 0) + 1;
    const { data, error } = await this.sb
      .from('user_bonus_usages')
      .upsert({
        user_id: userId,
        campaign_id: campaignId,
        times_used: nextTimesUsed,
        last_used_at: safeIsoNow(),
        updated_at: safeIsoNow(),
      }, { onConflict: 'user_id,campaign_id' })
      .select('id,user_id,campaign_id,times_used,last_used_at,created_at,updated_at')
      .single();
    if (error) throw error;
    return data;
  }
}

export function buildRepositories(sb) {
  return {
    profiles: new ProfileRepository(sb),
    fraud: new FraudRepository(sb),
    wallets: new WalletRepository(sb),
    rewardLocks: new RewardLockRepository(sb),
    rewardEvents: new RewardEventRepository(sb),
    campaigns: new CampaignRepository(sb),
    referrals: new ReferralRepository(sb),
    promos: new PromoRepository(sb),
    serviceOrders: new ServiceOrderRepository(sb),
    driverGamification: new DriverGamificationRepository(sb),
  };
}

export function buildRewardMetadata({ rewardKey, rewardType, sourceTable, campaignId = null, referralId = null, promoCodeId = null, extra = {} }) {
  return {
    reward_key: rewardKey,
    reward_type: rewardType,
    source_table: sourceTable || null,
    campaign_id: campaignId,
    referral_id: referralId,
    promo_code_id: promoCodeId,
    ...extra,
  };
}

export function buildRewardKey(...parts) {
  return normalizeRewardKey(parts);
}

export { WALLET_TX_KINDS, SERVICE_SOURCE_TABLES, SERVICE_TYPES };
