import { json } from '../_shared/cors.js';

function legacyDisabled(res) {
  return json(res, 410, {
    ok: false,
    error: 'Legacy auth disabled',
    code: 'LEGACY_AUTH_DISABLED',
    message: 'Bu endpoint production uchun o‘chirib qo‘yilgan. Faqat Supabase OTP flow ishlatiladi.',
  });
}

export async function auth_otp_request_handler(_req, res) {
  return legacyDisabled(res);
}

export async function auth_otp_verify_handler(_req, res) {
  return legacyDisabled(res);
}

export default async function handler(_req, res) {
  return legacyDisabled(res);
}
