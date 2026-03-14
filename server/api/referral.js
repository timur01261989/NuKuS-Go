import { applyCors, json, badRequest, serverError } from '../_shared/cors.js';
import {
  ensureReferralApplied,
  getAuthedContext,
  getOrCreateReferralCode,
  getProfileByUserId,
  getReferralSummary,
} from '../_shared/rewards.js';

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

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });

  try {
    const { sb, userId, ipAddress } = await getAuthedContext(req);
    if (!userId) return json(res, 401, { ok: false, error: 'Unauthorized' });

    const body = await readBody(req);
    const url = new URL(req.url, 'http://localhost');
    const action = String(body.action || url.searchParams.get('action') || 'summary').trim().toLowerCase();

    const profile = await getProfileByUserId(sb, userId);
    const myCode = await getOrCreateReferralCode(sb, userId, profile?.phone_normalized || profile?.phone || '');

    if (req.method === 'GET' || action === 'summary') {
      const summary = await getReferralSummary(sb, userId);
      return json(res, 200, {
        ok: true,
        code: myCode,
        summary,
      });
    }

    if (req.method !== 'POST') {
      return json(res, 405, { ok: false, error: 'Method not allowed' });
    }

    if (action === 'apply') {
      const referralCode = String(body.code || body.referral_code || '').trim().toUpperCase();
      const deviceHash = String(body.device_hash || '').trim() || null;
      if (!referralCode) return badRequest(res, 'referral code kerak');

      const { data: codeRow, error: codeError } = await sb
        .from('referral_codes')
        .select('id,user_id,code,is_active')
        .eq('code', referralCode)
        .eq('is_active', true)
        .maybeSingle();

      if (codeError) throw codeError;
      if (!codeRow) return badRequest(res, 'Referral code topilmadi');
      if (String(codeRow.user_id) === String(userId)) {
        return badRequest(res, 'O\'zingizning referral codingizni ishlata olmaysiz');
      }

      const referral = await ensureReferralApplied(sb, {
        referrerUserId: codeRow.user_id,
        referredUserId: userId,
        referralCodeId: codeRow.id,
        ipAddress,
        deviceHash,
      });

      return json(res, 200, {
        ok: true,
        referral,
        code: codeRow,
      });
    }

    return badRequest(res, 'action noto\'g\'ri');
  } catch (error) {
    return serverError(res, error);
  }
}
