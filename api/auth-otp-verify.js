import crypto from 'crypto';
import { json, badRequest, nowIso, uid } from './_lib.js';

function sign(payload, secret) {
  const data = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(data).toString('base64url') + '.' + sig;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { session_id, otp_code, phone } = body;

  if (!session_id) return badRequest(res, 'session_id kerak');
  if (String(otp_code||'') !== '1111') return badRequest(res, 'OTP noto‘g‘ri');

  const secret = process.env.AUTH_SECRET || 'dev-secret-change-me';
  const user = { id: uid('u'), phone: String(phone||'').trim(), created_at: nowIso() };
  const token = sign({ user, exp: Date.now() + 1000*60*60*24 }, secret); // 24h

  return json(res, 200, { ok:true, token, user });
}
