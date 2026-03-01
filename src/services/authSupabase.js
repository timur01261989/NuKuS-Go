import { supabase, assertSupabase } from '@/lib/supabase';

export async function requestOtp(phone) {
  assertSupabase();
  const sb = supabase;
  const { error } = await sb.auth.signInWithOtp({ phone });
  if (error) throw error;
  return { ok: true };
}

export async function verifyOtp(phone, token) {
  assertSupabase();
  const sb = supabase;
  const { data, error } = await sb.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) throw error;
  return { ok: true, session: data?.session, user: data?.user };
}

export async function signOut() {
  assertSupabase();
  const sb = supabase;
  const { error } = await sb.auth.signOut();
  if (error) throw error;
  return { ok: true };
}
