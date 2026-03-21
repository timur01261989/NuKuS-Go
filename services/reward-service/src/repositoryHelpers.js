import {
  DEFAULT_REWARD_CONFIG,
  normalizeRewardKey,
  safeIsoNow,
  toPositiveMoney,
} from './constants.js';

function isDuplicateError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('duplicate') || message.includes('unique constraint') || message.includes('already exists');
}

async function tryMaybeSingle(sb, table, selectors, userId) {
  let lastError = null;
  for (const selector of selectors) {
    const result = await sb.from(table).select(selector).eq('id', userId).maybeSingle();
    if (!result.error) {
      return { data: result.data || null, error: null };
    }
    lastError = result.error;
    const message = String(result.error?.message || '').toLowerCase();
    if (!message.includes('column')) {
      return { data: null, error: result.error };
    }
  }
  return { data: null, error: lastError };
}


function evaluateRule(rule, amountUzs) {
  const type = String(rule?.condition_type || '').toLowerCase();
  if (!type) return true;
  const operator = String(rule?.comparison_operator || '>=').trim();
  const left = type === 'order_amount_uzs' ? toPositiveMoney(amountUzs) : 0;
  const right = toPositiveMoney(rule?.condition_value);

  switch (operator) {
    case '=':
      return left === right;
    case '>':
      return left > right;
    case '<':
      return left < right;
    case '<=':
      return left <= right;
    case '>=':
    default:
      return left >= right;
  }
}

export class ReferralRepository {
  constructor(sb) {
    this.sb = sb;
  }

  async getCodeByUserId(userId) {
    if (!userId) return null;
    const { data, error } = await this.sb
      .from('referral_codes')
      .select('id,user_id,code,is_active,created_at,updated_at')
      .eq('user_id', userId)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    return rows.find((row) => Boolean(row?.is_active)) || rows[0] || null;
  }

  async getCodeByCode(code) {
    const normalizedCode = String(code || '').trim().toUpperCase();
    if (!normalizedCode) return null;
    const { data, error } = await this.sb
      .from('referral_codes')
      .select('id,user_id,code,is_active,created_at,updated_at')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    return rows[0] || null;
  }

  async createCode(userId, code) {
    const { data, error } = await this.sb
      .from('referral_codes')
      .insert({ user_id: userId, code: String(code || '').trim().toUpperCase(), is_active: true })
      .select('id,user_id,code,is_active,created_at,updated_at')
      .single();
    if (error) throw error;
    return data;
  }

  async getReferralForReferredUser(referredUserId) {
    const { data, error } = await this.sb
      .from('referrals')
      .select('id,referrer_user_id,referred_user_id,referral_code_id,status,qualified_order_id,qualified_at,rewarded_at,fraud_score,rejection_reason,ip_address,device_hash,metadata,created_at,updated_at')
      .eq('referred_user_id', referredUserId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async createPendingReferral({ referrerUserId, referredUserId, referralCodeId, ipAddress = null, deviceHash = null, fraudScore = 0, metadata = {} }) {
    const { data, error } = await this.sb
      .from('referrals')
      .insert({
        referrer_user_id: referrerUserId,
        referred_user_id: referredUserId,
        referral_code_id: referralCodeId,
        status: 'pending',
        qualified_order_id: null,
        qualified_at: null,
        rewarded_at: null,
        fraud_score: fraudScore,
        rejection_reason: null,
        ip_address: ipAddress,
        device_hash: deviceHash,
        metadata,
      })
      .select('id,referrer_user_id,referred_user_id,referral_code_id,status,qualified_order_id,qualified_at,rewarded_at,fraud_score,rejection_reason,ip_address,device_hash,metadata,created_at,updated_at')
      .single();
    if (error) throw error;
    return data;
  }

  async updateReferral(referralId, patch) {
    const { data, error } = await this.sb
      .from('referrals')
      .update({ ...patch, updated_at: safeIsoNow() })
      .eq('id', referralId)
      .select('id,referrer_user_id,referred_user_id,referral_code_id,status,qualified_order_id,qualified_at,rewarded_at,fraud_score,rejection_reason,ip_address,device_hash,metadata,created_at,updated_at')
      .single();
    if (error) throw error;
    return data;
  }

  async listSummary(userId) {
    const [referralsResult, rewardsResult] = await Promise.all([
      this.sb
        .from('referrals')
        .select('id,status,referred_user_id,qualified_order_id,qualified_at,rewarded_at,created_at,metadata')
        .eq('referrer_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      this.sb
        .from('referral_rewards')
        .select('id,referral_id,reward_user_id,reward_type,amount_uzs,created_at,metadata')
        .eq('reward_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (referralsResult.error) throw referralsResult.error;
    if (rewardsResult.error) throw rewardsResult.error;

    const referrals = referralsResult.data || [];
    const rewards = rewardsResult.data || [];
    return {
      referrals,
      rewards,
      totals: {
        invited_count: referrals.length,
        qualified_count: referrals.filter((item) => ['qualified', 'rewarded'].includes(String(item.status || ''))).length,
        rewarded_count: referrals.filter((item) => String(item.status || '') === 'rewarded').length,
        earned_uzs: rewards.reduce((sum, item) => sum + toPositiveMoney(item.amount_uzs), 0),
      },
    };
  }

  async createReferralReward({ referralId, rewardUserId, rewardType, amountUzs, walletTransactionId, metadata = {} }) {
    const { data, error } = await this.sb
      .from('referral_rewards')
      .insert({
        referral_id: referralId,
        reward_user_id: rewardUserId,
        reward_type: rewardType,
        amount_uzs: toPositiveMoney(amountUzs),
        wallet_transaction_id: walletTransactionId,
        metadata,
      })
      .select('id,referral_id,reward_user_id,reward_type,amount_uzs,wallet_transaction_id,metadata,created_at')
      .single();
    if (error && !isDuplicateError(error)) throw error;
    return data || null;
  }
}

export class PromoRepository {
  constructor(sb) {
    this.sb = sb;
  }

  async getPromoByCode(code) {
    const normalizedCode = String(code || '').trim().toUpperCase();
    if (!normalizedCode) return null;
    const now = safeIsoNow();
    const { data, error } = await this.sb
      .from('promo_codes')
      .select('id,code,title,description,discount_type,discount_value,max_discount_uzs,min_order_amount_uzs,usage_limit_total,usage_limit_per_user,starts_at,ends_at,is_active,created_by,metadata,created_at,updated_at')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async countRedemptions({ promoCodeId, userId = null }) {
    let query = this.sb
      .from('promo_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('promo_code_id', promoCodeId)
      .neq('status', 'reverted');
    if (userId) query = query.eq('user_id', userId);
    const { count, error } = await query;
    if (error) throw error;
    return Number(count || 0);
  }

  async getRedemptionByOrderId(orderId) {
    const { data, error } = await this.sb
      .from('promo_redemptions')
      .select('id,promo_code_id,user_id,order_id,discount_uzs,status,metadata,created_at')
      .eq('order_id', orderId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async createRedemption({ promoCodeId, userId, orderId, discountUzs, status = 'applied', metadata = {} }) {
    const { data, error } = await this.sb
      .from('promo_redemptions')
      .insert({
        promo_code_id: promoCodeId,
        user_id: userId,
        order_id: orderId,
        discount_uzs: toPositiveMoney(discountUzs),
        status,
        metadata,
      })
      .select('id,promo_code_id,user_id,order_id,discount_uzs,status,metadata,created_at')
      .single();
    if (error) throw error;
    return data;
  }

  async updateRedemption(redemptionId, patch) {
    const { data, error } = await this.sb
      .from('promo_redemptions')
      .update(patch)
      .eq('id', redemptionId)
      .select('id,promo_code_id,user_id,order_id,discount_uzs,status,metadata,created_at')
      .single();
    if (error) throw error;
    return data;
  }
}

export class ServiceOrderRepository {
  constructor(sb) {
    this.sb = sb;
  }

  async getBySource({ sourceTable = SERVICE_SOURCE_TABLES.ORDERS, sourceId }) {
    if (!sourceId) return null;

    if (sourceTable === SERVICE_SOURCE_TABLES.ORDERS) {
      const { data, error } = await this.sb
        .from('orders')
        .select('id,user_id,driver_id,service_type,status,payment_method,price_uzs,commission_uzs,driver_payout_uzs,route_meta,created_at,updated_at,completed_at,cancelled_at')
        .eq('id', sourceId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapUnifiedOrder(data, sourceTable) : null;
    }

    if (sourceTable === SERVICE_SOURCE_TABLES.DELIVERY_ORDERS) {
      const { data, error } = await this.sb
        .from('delivery_orders')
        .select('id,user_id,driver_user_id,service_mode,status,payment_method,price,price_uzs,commission_amount,history,created_at,updated_at')
        .eq('id', sourceId)
        .maybeSingle();
      if (error) throw error;
      return data
        ? {
            source_table: sourceTable,
            source_id: data.id,
            user_id: data.user_id,
            driver_user_id: data.driver_user_id,
            service_type: SERVICE_TYPES.DELIVERY,
            status: data.status,
            payment_method: data.payment_method || 'cash',
            amount_uzs: toPositiveMoney(data.price_uzs ?? data.price),
            commission_uzs: toPositiveMoney(data.commission_amount),
            driver_payout_uzs: 0,
            route_meta: { service_mode: data.service_mode || 'city', history: data.history || [] },
            raw: data,
          }
        : null;
    }

    if (sourceTable === SERVICE_SOURCE_TABLES.CARGO_ORDERS) {
      const { data, error } = await this.sb
        .from('cargo_orders')
        .select('id,user_id,driver_user_id,status,price_uzs,budget,selected_offer_id,created_at,updated_at')
        .eq('id', sourceId)
        .maybeSingle();
      if (error) throw error;
      return data
        ? {
            source_table: sourceTable,
            source_id: data.id,
            user_id: data.user_id,
            driver_user_id: data.driver_user_id,
            service_type: SERVICE_TYPES.CARGO,
            status: data.status,
            payment_method: 'cash',
            amount_uzs: toPositiveMoney(data.price_uzs ?? data.budget),
            commission_uzs: 0,
            driver_payout_uzs: 0,
            route_meta: { selected_offer_id: data.selected_offer_id || null },
            raw: data,
          }
        : null;
    }

    if (sourceTable === SERVICE_SOURCE_TABLES.INTERPROV_TRIPS) {
      const { data, error } = await this.sb
        .from('interprov_trips')
        .select('id,user_id,route_key,status,seat_price_uzs,created_at,updated_at')
        .eq('id', sourceId)
        .maybeSingle();
      if (error) throw error;
      return data
        ? {
            source_table: sourceTable,
            source_id: data.id,
            user_id: data.user_id,
            driver_user_id: data.user_id,
            service_type: SERVICE_TYPES.INTERPROV,
            status: data.status,
            payment_method: 'cash',
            amount_uzs: toPositiveMoney(data.seat_price_uzs),
            commission_uzs: 0,
            driver_payout_uzs: 0,
            route_meta: { route_key: data.route_key || null },
            raw: data,
          }
        : null;
    }

    if (sourceTable === SERVICE_SOURCE_TABLES.DISTRICT_TRIPS) {
      const { data, error } = await this.sb
        .from('district_trips')
        .select('id,user_id,route_key,status,seat_price_uzs,created_at,updated_at')
        .eq('id', sourceId)
        .maybeSingle();
      if (error) throw error;
      return data
        ? {
            source_table: sourceTable,
            source_id: data.id,
            user_id: data.user_id,
            driver_user_id: data.user_id,
            service_type: SERVICE_TYPES.DISTRICT,
            status: data.status,
            payment_method: 'cash',
            amount_uzs: toPositiveMoney(data.seat_price_uzs),
            commission_uzs: 0,
            driver_payout_uzs: 0,
            route_meta: { route_key: data.route_key || null },
            raw: data,
          }
        : null;
    }

    throw new Error(`Unsupported source table: ${sourceTable}`);
  }

  async countCompletedUserOrders(userId) {
    const [orders, delivery, cargo, interprov, district] = await Promise.all([
      this.sb.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', COMPLETED_STATUSES_BY_SOURCE[SERVICE_SOURCE_TABLES.ORDERS]),
      this.sb.from('delivery_orders').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', COMPLETED_STATUSES_BY_SOURCE[SERVICE_SOURCE_TABLES.DELIVERY_ORDERS]),
      this.sb.from('cargo_orders').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', COMPLETED_STATUSES_BY_SOURCE[SERVICE_SOURCE_TABLES.CARGO_ORDERS]),
      this.sb.from('interprov_trips').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', COMPLETED_STATUSES_BY_SOURCE[SERVICE_SOURCE_TABLES.INTERPROV_TRIPS]),
      this.sb.from('district_trips').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', COMPLETED_STATUSES_BY_SOURCE[SERVICE_SOURCE_TABLES.DISTRICT_TRIPS]),
    ]);
    if (orders.error) throw orders.error;
    if (delivery.error) throw delivery.error;
    if (cargo.error) throw cargo.error;
    if (interprov.error) throw interprov.error;
    if (district.error) throw district.error;
    return Number(orders.count || 0)
      + Number(delivery.count || 0)
      + Number(cargo.count || 0)
      + Number(interprov.count || 0)
      + Number(district.count || 0);
  }

  async updateOrderPromoState({ orderId, nextPriceUzs, routeMeta }) {
    const { data, error } = await this.sb
      .from('orders')
      .update({ price_uzs: nextPriceUzs, route_meta: routeMeta, updated_at: safeIsoNow() })
      .eq('id', orderId)
      .select('id,user_id,price_uzs,route_meta,status')
      .single();
    if (error) throw error;
    return data;
  }
}

function mapUnifiedOrder(data, sourceTable) {
  return {
    source_table: sourceTable,
    source_id: data.id,
    user_id: data.user_id,
    driver_user_id: data.driver_id,
    service_type: data.service_type || SERVICE_TYPES.TAXI,
    status: data.status,
    payment_method: data.payment_method || 'cash',
    amount_uzs: toPositiveMoney(data.price_uzs),
    commission_uzs: toPositiveMoney(data.commission_uzs),
    driver_payout_uzs: toPositiveMoney(data.driver_payout_uzs),
    route_meta: data.route_meta || {},
    raw: data,
  };
}

export class DriverGamificationRepository {
  constructor(sb) {
    this.sb = sb;
  }

  async getStatus(userId) {
    const [{ data: gamification, error: gamificationError }, { data: levels, error: levelsError }, { data: missions, error: missionsError }] = await Promise.all([
      this.sb.from('driver_gamification').select('driver_id,level_name,total_trips,total_earnings_uzs,bonus_points,streak_days,updated_at').eq('driver_id', userId).maybeSingle(),
      this.sb.from('driver_levels').select('id,name,min_trips,min_rating,commission_rate,priority_dispatch,badge_color,badge_emoji,bonus_multiplier,sort_order').order('sort_order', { ascending: true }),
      this.sb.from('daily_missions').select('id,title,description,target_type,target_value,bonus_uzs,bonus_points,level_name,is_active,valid_from,valid_to,created_at').eq('is_active', true).order('created_at', { ascending: false }),
    ]);

    if (gamificationError) throw gamificationError;
    if (levelsError) throw levelsError;
    if (missionsError) throw missionsError;

    const today = safeIsoNow().slice(0, 10);
    const missionIds = (missions || []).map((item) => item.id);
    let progressRows = [];
    if (missionIds.length) {
      const { data, error } = await this.sb
        .from('mission_progress')
        .select('mission_id,current_value,completed,rewarded,date')
        .eq('driver_id', userId)
        .eq('date', today)
        .in('mission_id', missionIds);
      if (error) throw error;
      progressRows = data || [];
    }

    const progressMap = new Map(progressRows.map((row) => [row.mission_id, row]));
    return {
      gamification: gamification || {
        driver_id: userId,
        level_name: 'Yangi',
        total_trips: 0,
        total_earnings_uzs: 0,
        bonus_points: 0,
        streak_days: 0,
      },
      levels: levels || [],
      missions: (missions || []).map((mission) => ({
        ...mission,
        current_value: Number(progressMap.get(mission.id)?.current_value || 0),
        completed: Boolean(progressMap.get(mission.id)?.completed || false),
        rewarded: Boolean(progressMap.get(mission.id)?.rewarded || false),
      })),
    };
  }

  async listLevels() {
    const { data, error } = await this.sb
      .from('driver_levels')
      .select('id,name,min_trips,min_rating,commission_rate,priority_dispatch,badge_color,badge_emoji,bonus_multiplier,sort_order')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async listMissions() {
    const { data, error } = await this.sb
      .from('daily_missions')
      .select('id,title,description,target_type,target_value,bonus_uzs,bonus_points,level_name,is_active,valid_from,valid_to,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async updateLevel(levelId, patch) {
    const { data, error } = await this.sb
      .from('driver_levels')
      .update(patch)
      .eq('id', levelId)
      .select('id,name,min_trips,min_rating,commission_rate,priority_dispatch,badge_color,badge_emoji,bonus_multiplier,sort_order')
      .single();
    if (error) throw error;
    return data;
  }

  async updateMission(missionId, patch) {
    const { data, error } = await this.sb
      .from('daily_missions')
      .update(patch)
      .eq('id', missionId)
      .select('id,title,description,target_type,target_value,bonus_uzs,bonus_points,level_name,is_active,valid_from,valid_to,created_at')
      .single();
    if (error) throw error;
    return data;
  }

  async createMission(payload) {
    const { data, error } = await this.sb
      .from('daily_missions')
      .insert(payload)
      .select('id,title,description,target_type,target_value,bonus_uzs,bonus_points,level_name,is_active,valid_from,valid_to,created_at')
      .single();
    if (error) throw error;
    return data;
  }

  async deleteMission(missionId) {
    const { error } = await this.sb.from('daily_missions').delete().eq('id', missionId);
    if (error) throw error;
    return true;
  }
}


export { isDuplicateError, tryMaybeSingle, evaluateRule, mapUnifiedOrder };
