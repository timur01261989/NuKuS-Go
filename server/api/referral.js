import { applyCors, json, badRequest, serverError } from '../_shared/cors.js';
import { getAuthedContext } from '../_shared/rewards.js';
import { getRewardService } from '../_shared/reward-engine/factory.js';
import { getSupabaseAdmin, getBearerToken } from '../_shared/supabase.js';

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', resolve);
    req.on('error', reject);
  });
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

function getUrl(req) {
  return new URL(req.url, 'http://localhost');
}

function normalizeReferralCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);
}

function getRequestIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for'] || req?.headers?.['X-Forwarded-For'] || '';
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return String(req?.socket?.remoteAddress || req?.connection?.remoteAddress || '').trim() || null;
}

function getUserAgent(req) {
  return String(req?.headers?.['user-agent'] || '').trim() || null;
}

async function logReferralBonusEvent(sb, payload) {
  try {
    await sb.from('bonus_events').insert({
      event_type: 'referral_link_opened',
      user_id: null,
      related_user_id: payload.related_user_id || null,
      source_id: payload.source_id || null,
      source_type: 'referral_link',
      payload_json: {
        code: payload.code || null,
        ip_address: payload.ip_address || null,
        user_agent: payload.user_agent || null,
        referer: payload.referer || null,
        path: payload.path || null,
      },
      status: 'done',
      attempt_count: 0,
      last_error: null,
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[referral] failed to log referral_link_opened bonus_event:', error?.message || error);
  }
}

function buildInviterProfile(profileRow, codeRow) {
  const phoneFallback = String(profileRow?.phone || '').trim();
  const fullName = String(profileRow?.full_name || profileRow?.name || profileRow?.first_name || '').trim() || phoneFallback || 'UniGo foydalanuvchisi';
  return {
    user_id: profileRow?.id || codeRow.user_id,
    full_name: fullName,
    avatar_url: profileRow?.avatar_url || null,
    phone: phoneFallback || null,
  };
}

async function resolveReferralPublic(sb, req, res, url) {
  const rewardService = getRewardService(sb);
  const referralCodeValue = normalizeReferralCode(url.searchParams.get('code'));

  if (!referralCodeValue) {
    return badRequest(res, 'referral code kerak');
  }

  const codeRow = await rewardService.repositories.referrals.getCodeByCode(referralCodeValue);
  if (!codeRow) {
    return json(res, 404, {
      ok: false,
      valid: false,
      error: 'Referral code topilmadi',
      code: referralCodeValue,
    });
  }

  const { data: inviterProfile } = await sb
    .from('profiles')
    .select('id,phone')
    .eq('id', codeRow.user_id)
    .maybeSingle();

  await logReferralBonusEvent(sb, {
    related_user_id: codeRow.user_id,
    source_id: codeRow.id,
    code: codeRow.code,
    ip_address: getRequestIp(req),
    user_agent: getUserAgent(req),
    referer: String(req?.headers?.referer || req?.headers?.Referer || '').trim() || null,
    path: url.pathname,
  });

  return json(res, 200, {
    ok: true,
    valid: true,
    code: {
      id: codeRow.id,
      code: codeRow.code,
      user_id: codeRow.user_id,
      is_active: codeRow.is_active,
      created_at: codeRow.created_at,
      updated_at: codeRow.updated_at,
    },
    inviter: buildInviterProfile(inviterProfile, codeRow),
  });
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });

  try {
    const body = await readBody(req);
    const url = getUrl(req);
    const action = String(body.action || url.searchParams.get('action') || 'summary').trim().toLowerCase();

    if (req.method === 'GET' && action === 'resolve') {
      const sb = getSupabaseAdmin();
      return await resolveReferralPublic(sb, req, res, url);
    }

    const { sb, userId, ipAddress } = await getAuthedContext(req);
    if (!userId || !getBearerToken(req)) {
      return json(res, 401, { ok: false, error: 'Unauthorized' });
    }

    const rewardService = getRewardService(sb);
    const profile = await rewardService.repositories.profiles.getByUserId(userId);
    const myCode = await rewardService.getOrCreateReferralCode(
      userId,
      profile?.phone_normalized || profile?.phone || userId,
    );

    if (req.method === 'GET' || action === 'summary') {
      const [summaryResult, configResult] = await Promise.allSettled([
        rewardService.repositories.referrals.listSummary(userId),
        rewardService.repositories.campaigns.getRewardProgramConfig(),
      ]);

      const summary = summaryResult.status === 'fulfilled'
        ? summaryResult.value
        : {
            referrals: [],
            rewards: [],
            wallet: null,
            totals: {
              invited_count: 0,
              qualified_count: 0,
              rewarded_count: 0,
              earned_uzs: 0,
            },
          };

      const config = configResult.status === 'fulfilled'
        ? configResult.value
        : {
            referral: {
              campaign_id: null,
              reward_amount_uzs: 3000,
              min_order_amount_uzs: 20000,
              metadata: {},
            },
            driver_milestone: {
              campaign_id: null,
              reward_amount_uzs: 10000,
              milestone_trips: 5,
              metadata: {},
            },
          };

      return json(res, 200, {
        ok: true,
        code: myCode,
        summary,
        config,
        degraded: summaryResult.status !== 'fulfilled' || configResult.status !== 'fulfilled',
      });
    }

    if (req.method !== 'POST') {
      return json(res, 405, { ok: false, error: 'Method not allowed' });
    }

    if (action === 'apply') {
      const referralCodeValue = normalizeReferralCode(body.code || body.referral_code || '');
      const deviceHash = String(body.device_hash || '').trim() || null;
      if (!referralCodeValue) return badRequest(res, 'referral code kerak');

      const codeRow = await rewardService.repositories.referrals.getCodeByCode(referralCodeValue);
      if (!codeRow) return badRequest(res, 'Referral code topilmadi');
      if (String(codeRow.user_id) === String(userId)) {
        return badRequest(res, 'O\'zingizning referral codingizni ishlata olmaysiz');
      }

      const referral = await rewardService.applyReferral({
        referrerUserId: codeRow.user_id,
        referredUserId: userId,
        referralCodeId: codeRow.id,
        ipAddress,
        deviceHash,
      });

      return json(res, 200, {
        ok: true,
        referral,
        code: {
          id: codeRow.id,
          code: codeRow.code,
          user_id: codeRow.user_id,
          is_active: codeRow.is_active,
        },
      });
    }

    return badRequest(res, 'action noto\'g\'ri');
  } catch (error) {
    return serverError(res, error);
  }
}
