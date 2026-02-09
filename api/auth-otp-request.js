import { json, badRequest, nowIso, uid, isPhone } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const phone = String(body.phone || '').trim();

  if (!isPhone(phone)) return badRequest(res, 'Telefon raqam noto‘g‘ri', { field:'phone' });

  // DEMO: return fixed OTP and session id
  const session_id = uid('otp');
  const otp_code = '1111'; // demo only
  return json(res, 200, { ok:true, session_id, otp_code, sent_at: nowIso() });
}
