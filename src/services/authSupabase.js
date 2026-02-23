import { assertSupabase } from './supabaseClient.js';

export async function requestOtp(phone) {
  const sb = assertSupabase();
  const { error } = await sb.auth.signInWithOtp({ phone });
  if (error) throw error;
  return { ok: true };
}

export async function verifyOtp(phone, token) {
  const sb = assertSupabase();
  const { data, error } = await sb.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) throw error;
  return { ok: true, session: data?.session, user: data?.user };
}

export async function signOut() {
  const sb = assertSupabase();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
  return { ok: true };
}
