// api/auth.js
// Combined auth: OTP request + OTP verify

import crypto from 'crypto';
import { json, badRequest, nowIso, uid, isPhone } from './_shared/cors.js';
// NOTE: duplicate import removed to avoid build failure (kept full functionality).


export async function auth_otp_request_handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const phone = String(body.phone || '').trim();

  if (!isPhone(phone)) return badRequest(res, 'Telefon raqam noto‘g‘ri', { field:'phone' });

  // DEMO: return fixed OTP and session id
  const session_id = uid('otp');
  const otp_code = '111111'; // demo only
  return json(res, 200, { ok:true, session_id, otp_code, sent_at: nowIso() });
}


function sign(payload, secret) {
  const data = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(data).toString('base64url') + '.' + sig;
}

export async function auth_otp_verify_handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { session_id, otp_code, phone } = body;

  if (!session_id) return badRequest(res, 'session_id kerak');
  if (String(otp_code||'') !== '111111') return badRequest(res, 'OTP noto‘g‘ri');

  const secret = process.env.AUTH_SECRET || 'dev-secret-change-me';
  const user = { id: uid('u'), phone: String(phone||'').trim(), created_at: nowIso() };
  const token = sign({ user, exp: Date.now() + 1000*60*60*24 }, secret); // 24h

  return json(res, 200, { ok:true, token, user });
}

export default async function auth(req, res, routeKey = 'auth') {
  // Backward compatible route keys:
  // - auth-otp-request
  // - auth-otp-verify
  // New consolidated key:
  // - auth  (action via query/body)
  const url = new URL(req.url, 'http://localhost');
  const action = url.searchParams.get('action') || (typeof req.body === 'object' && req.body?.action) || (typeof req.body === 'string' ? (()=>{try{return JSON.parse(req.body||'{}').action}catch{return null}})() : null);

  switch (routeKey) {
    case 'auth-otp-request':
      return await auth_otp_request_handler(req, res);
    case 'auth-otp-verify':
      return await auth_otp_verify_handler(req, res);
    case 'auth':
    default:
      if (action === 'otp-request') return await auth_otp_request_handler(req, res);
      if (action === 'otp-verify') return await auth_otp_verify_handler(req, res);
      // default: if client calls /api/auth without action, infer by body fields
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        if (body.otp_code || body.code) return await auth_otp_verify_handler(req, res);
        return await auth_otp_request_handler(req, res);
      } catch {
        return await auth_otp_request_handler(req, res);
      }
  }
}
