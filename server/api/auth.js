import crypto from 'crypto';
import { json, badRequest, nowIso, uid, isPhone } from '../_shared/cors.js';
import { getServerEnv } from '../_shared/env.js';

function sign(payload, secret) {
  const data = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(data).toString('base64url') + '.' + sig;
}

function legacyDisabled(res) {
  return json(res, 410, {
    ok: false,
    error: 'Legacy auth disabled',
    code: 'LEGACY_AUTH_DISABLED',
  });
}

export async function auth_otp_request_handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
  const env = getServerEnv();
  if (!env.LEGACY_AUTH_ENABLED || env.NODE_ENV === 'production') {
    return legacyDisabled(res);
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const phone = String(body.phone || '').trim();

  if (!isPhone(phone)) return badRequest(res, 'Telefon raqam noto\'g\'ri', { field:'phone' });

  const session_id = uid('otp');
  const otp_code = '1111';
  return json(res, 200, {
    ok:true,
    legacy:true,
    session_id,
    otp_code,
    sent_at: nowIso(),
    warning: 'Legacy demo auth faqat development uchun yoqilgan',
  });
}

export async function auth_otp_verify_handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
  const env = getServerEnv();
  if (!env.LEGACY_AUTH_ENABLED || env.NODE_ENV === 'production') {
    return legacyDisabled(res);
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { session_id, otp_code, phone } = body;

  if (!session_id) return badRequest(res, 'session_id kerak');
  if (String(otp_code||'') !== '1111') return badRequest(res, 'OTP noto\'g\'ri');
  if (!env.AUTH_SECRET) return json(res, 500, { ok:false, error:'AUTH_SECRET missing', code:'AUTH_SECRET_MISSING' });

  const user = { id: uid('u'), phone: String(phone||'').trim(), created_at: nowIso() };
  const token = sign({ user, exp: Date.now() + 1000*60*60*24 }, env.AUTH_SECRET);

  return json(res, 200, {
    ok:true,
    legacy:true,
    token,
    user,
    warning: 'Legacy demo auth faqat development uchun yoqilgan',
  });
}

export default async function handler(req, res) {
  const action = String(req.query?.action || req.body?.action || '').trim().toLowerCase();
  if (action === 'otp-request') return auth_otp_request_handler(req, res);
  if (action === 'otp-verify') return auth_otp_verify_handler(req, res);
  return legacyDisabled(res);
}
