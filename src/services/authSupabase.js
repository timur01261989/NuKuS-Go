import { assertSupabase } from './supabaseClient.js';

export async function requestOtp(phone) {
  // TEMP (MVP): SMS provider disabled.
  // We use our serverless API which returns a fixed OTP "111111".
  const resp = await fetch("/api/auth?action=otp-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.ok) {
    const msg = data?.error || "OTP yuborishda xato";
    throw new Error(msg);
  }

  // Return same shape expected by callers
  return { ok: true, session_id: data.session_id, otp_code: data.otp_code };
}

export async function verifyOtp(phone, token) {
  // TEMP (MVP): accept fixed OTP "111111" via our API.
  // token = OTP code from user input
  const resp = await fetch("/api/auth?action=otp-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp_code: token, session_id: "otp-local" }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.ok) {
    const msg = data?.error || "OTP tasdiqlashda xato";
    throw new Error(msg);
  }

  // Provide a session-like object for callers that expect it
  const session = data?.token ? { access_token: data.token } : null;
  return { ok: true, session, user: data?.user ?? null, token: data?.token ?? null };
}

export async function signOut() {
  const sb = assertSupabase();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
  return { ok: true };
}
