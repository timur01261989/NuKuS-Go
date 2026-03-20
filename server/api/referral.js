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

function buildShareUrl(req, code) {
  const normalizedCode = normalizeReferralCode(code);
  if (!normalizedCode) return '';

  const configuredBase = String(process.env.APP_SHARE_BASE_URL || process.env.WEB_URL || '').trim().replace(/\/$/, '');
  if (configuredBase) {
    return `${configuredBase}/r/${normalizedCode}`;
  }

  const host = String(req?.headers?.['x-forwarded-host'] || req?.headers?.host || '').trim();
  const proto = String(req?.headers?.['x-forwarded-proto'] || '').trim() || 'https';
  if (host) {
    return `${proto}://${host}/r/${normalizedCode}`;
  }

  return `/r/${normalizedCode}`;
}

async function loadInviterProfile(sb, inviterUserId) {
  if (!inviterUserId) return null;

  try {
    const primaryResult = await sb
      .from('profiles')
      .select('id,phone,full_name,avatar_url')
      .eq('id', inviterUserId)
      .maybeSingle();

    if (!primaryResult.error) {
      return primaryResult.data || null;
    }

    const message = String(primaryResult.error?.message || '').toLowerCase();
    if (!message.includes('column')) {
      throw primaryResult.error;
    }

    const fallbackResult = await sb
      .from('profiles')
      .select('id,phone')
      .eq('id', inviterUserId)
      .maybeSingle();
    if (fallbackResult.error) throw fallbackResult.error;

    return fallbackResult.data
      ? {
          ...fallbackResult.data,
          full_name: null,
          avatar_url: null,
        }
      : null;
  } catch (error) {
    console.error('[referral] loadInviterProfile error', { inviterUserId, error });
    // If profile loading fails, return null so caller can fallback to codeRow.user_id
    return null;
  }
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

async function resolveReferralPublic(sb, req, res, url) {
  const rewardService = getRewardService(sb);
  const referralCodeValue = normalizeReferralCode(url.searchParams.get('code'));

  if (!referralCodeValue) {
    return badRequest(res, 'referral code kerak');
  }

  try {
    const codeRow = await rewardService.repositories.referrals.getCodeByCode(referralCodeValue);
    if (!codeRow) {
      return json(res, 404, {
        ok: false,
        valid: false,
        error: 'Referral code topilmadi',
        code: referralCodeValue,
      });
    }

    const inviterProfile = await loadInviterProfile(sb, codeRow.user_id);

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
      inviter: {
        user_id: inviterProfile?.id || codeRow.user_id,
        full_name: inviterProfile?.full_name || 'UniGo foydalanuvchisi',
        avatar_url: inviterProfile?.avatar_url || null,
        phone: inviterProfile?.phone || null,
      },
    });
  } catch (error) {
    console.error('[referral] resolveReferralPublic error', { referralCodeValue, error });
    return serverError(res, error);
  }
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });

  // Supabase env yo'q bo'lsa darhol xabar ber
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 503, {
      ok: false,
      error: 'server_config_missing',
      details: 'SUPABASE_URL yoki SUPABASE_SERVICE_ROLE_KEY env o\'zgaruvchisi sozlanmagan',
    });
  }

  try {
    const body = await readBody(req);
    const url = getUrl(req);
    const action = String(body.action || url.searchParams.get('action') || 'summary').trim().toLowerCase();

    if (req.method === 'GET' && action === 'resolve') {
      const sb = getSupabaseAdmin();
      return await resolveReferralPublic(sb, req, res, url);
    }

    // Authenticated paths: wrap getAuthedContext to log and return proper error if it fails
    let sb, user, userId, ipAddress;
    try {
      const authed = await getAuthedContext(req);
      sb = authed.sb;
      user = authed.user;
      userId = authed.userId;
      ipAddress = authed.ipAddress;
    } catch (error) {
      console.error('[referral] getAuthedContext failed', { error });
      return json(res, 401, { ok: false, error: 'Unauthorized', details: String(error?.message || error) });
    }

    if (!userId || !getBearerToken(req)) {
      return json(res, 401, { ok: false, error: 'Unauthorized' });
    }

    const rewardService = getRewardService(sb);

    let profile = null;
    let myCode = null;
    const warnings = [];

    try {
      profile = await rewardService.repositories.profiles.getByUserId(userId);
    } catch (error) {
      console.error('[referral] profiles.getByUserId error', { userId, error });
      warnings.push(`profile:${String(error?.message || error)}`);
    }

    try {
      myCode = await rewardService.getOrCreateReferralCode(
        userId,
        profile?.phone_normalized || profile?.phone || userId,
        { authUser: user },
      );
    } catch (error) {
      console.error('[referral] getOrCreateReferralCode initial error', { userId, error });
      warnings.push(`code:${String(error?.message || error)}`);
      try {
        if (user?.id) {
          await rewardService.repositories.profiles.ensureProfile(user);
          myCode = await rewardService.getOrCreateReferralCode(userId, profile?.phone || userId, { authUser: user });
        }
      } catch (retryError) {
        console.error('[referral] getOrCreateReferralCode retry error', { userId, retryError });
        warnings.push(`code_retry:${String(retryError?.message || retryError)}`);
      }
    }

    if (req.method === 'GET' || action === 'summary' || action === 'bootstrap') {
      let summary = {
        referrals: [],
        rewards: [],
        totals: {
          invited_count: 0,
          qualified_count: 0,
          rewarded_count: 0,
          earned_uzs: 0,
        },
      };
      let wallet = {
        user_id: userId,
        balance_uzs: 0,
        bonus_balance_uzs: 0,
        reserved_uzs: 0,
        total_topup_uzs: 0,
        total_spent_uzs: 0,
        total_earned_uzs: 0,
        is_frozen: false,
      };
      const summaryWarnings = [...warnings];

      try {
        summary = await rewardService.repositories.referrals.listSummary(userId);
      } catch (error) {
        console.error('[referral] referrals.listSummary error', { userId, error });
        summaryWarnings.push(`summary:${String(error?.message || error)}`);
      }

      try {
        wallet = await rewardService.repositories.wallets.ensureWallet(userId);
      } catch (error) {
        console.error('[referral] wallets.ensureWallet error', { userId, error });
        summaryWarnings.push(`wallet:${String(error?.message || error)}`);
      }

      // Always return a structured response; include warnings so frontend can handle gracefully
      return json(res, 200, {
        ok: true,
        code: myCode,
        share_url: buildShareUrl(req, myCode?.code || ''),
        wallet,
        summary,
        warnings: summaryWarnings,
      });
    }

    if (req.method !== 'POST') {
      return json(res, 405, { ok: false, error: 'Method not allowed' });
    }

    if (action === 'apply') {
      const referralCodeValue = normalizeReferralCode(body.code || body.referral_code || '');
      const deviceHash = String(body.device_hash || '').trim() || null;
      if (!referralCodeValue) return badRequest(res, 'referral code kerak');

      let codeRow;
      try {
        codeRow = await rewardService.repositories.referrals.getCodeByCode(referralCodeValue);
      } catch (error) {
        console.error('[referral] getCodeByCode error', { referralCodeValue, error });
        return serverError(res, error);
      }

      if (!codeRow) return badRequest(res, 'Referral code topilmadi');
      if (String(codeRow.user_id) === String(userId)) {
        return badRequest(res, 'O\'zingizning referral codingizni ishlata olmaysiz');
      }

      let referral;
      try {
        referral = await rewardService.applyReferral({
          referrerUserId: codeRow.user_id,
          referredUserId: userId,
          referralCodeId: codeRow.id,
          ipAddress,
          deviceHash,
        });
      } catch (error) {
        console.error('[referral] applyReferral error', { userId, codeRow, error });
        return serverError(res, error);
      }

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
    console.error('[referral] handler outer catch', error);

    // Convert known HTTP errors to JSON responses and avoid generic 500 for normal client-side invalid data
    const status = Number(error?.status || 0);
    if ([400, 401, 403, 404].includes(status)) {
      return json(res, status, {
        ok: false,
        error: String(error?.message || 'Request failed'),
        details: String(error?.details || ''),
      });
    }

    return serverError(res, error);
  }
}
