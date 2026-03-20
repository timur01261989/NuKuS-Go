import { supabase, assertSupabase } from "./supabaseClient.js";
import {
  deriveDriverApproved,
  normalizeRole,
  normalizeStatus,
  tryProfileSelect,
} from "./authService.helpers.js";
import { resolveAuthSessionState } from "./authService.resolver.js";

export async function requestOtp(phone) {
  assertSupabase();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
  return { ok: true };
}

export async function verifyOtp(phone, token) {
  assertSupabase();
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) throw error;
  return { ok: true, session: data?.session ?? null, user: data?.user ?? null };
}

export async function signOut() {
  assertSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return { ok: true };
}

export async function getSession() {
  assertSupabase();
  try {
    const result = await supabase.auth.getSession();
    if (result?.error) {
      // Normalize Supabase 400/invalid session errors.
      if (result.error?.status === 400 || result.error?.status === 401) {
        console.warn('[AuthService] getSession invalid session, forcing sign out', result.error.message);
        await supabase.auth.signOut().catch(() => null);
        return { data: null, error: result.error };
      }
      return { data: null, error: result.error };
    }
    return result;
  } catch (error) {
    console.error('[AuthService] getSession failed', error);
    // On auth service network failures, keep app usable with anonymous fallback.
    return { data: null, error };
  }
}

export async function getUser() {
  assertSupabase();
  try {
    const result = await supabase.auth.getUser();
    if (result?.error) {
      if (result.error?.status === 400 || result.error?.status === 401) {
        console.warn('[AuthService] getUser invalid session, forcing sign out', result.error.message);
        await supabase.auth.signOut().catch(() => null);
      }
      return { data: null, error: result.error };
    }
    return result;
  } catch (error) {
    console.error('[AuthService] getUser failed', error);
    return { data: null, error };
  }
}

export function onAuthStateChange(callback) {
  assertSupabase();
  return supabase.auth.onAuthStateChange(callback);
}

export async function fetchProfileByUserId(userId) {
  if (!userId) {
    return { data: null, error: null };
  }

  const result = await tryProfileSelect(userId, [
    'id,role,current_role,is_admin,phone,phone_normalized,full_name,avatar_url,updated_at',
    'id,role,current_role,is_admin,phone,full_name,avatar_url,updated_at',
    'id,role,current_role,is_admin,phone,updated_at',
    'id,role,current_role,phone,updated_at',
    'id,role,current_role,phone',
  ]);

  if (result.data) {
    return {
      data: {
        phone_normalized: null,
        full_name: null,
        avatar_url: null,
        is_admin: false,
        ...result.data,
      },
      error: null,
    };
  }

  return {
    data: null,
    error: result.error ?? null,
  };
}

export async function upsertMinimalClientProfile(user) {
  if (!user?.id) {
    return { data: null, error: null };
  }

  const timestamp = new Date().toISOString();
  const payload = {
    id: user.id,
    role: "client",
    updated_at: timestamp,
  };

  if (user.email) payload.email = user.email;
  if (user.phone) payload.phone = user.phone;

  const result = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id,role,current_role,is_admin,phone,phone_normalized,full_name,avatar_url,updated_at")
    .maybeSingle();

  return { data: result.data ?? null, error: result.error ?? null };
}

export function createEmptyAuthState(session = null) {
  const user = session?.user ?? null;

  return {
    loading: false,
    authReady: true,
    isAuthed: !!user,
    session,
    user,
    profile: null,
    role: user ? "client" : null,
    isAdmin: false,
    driver: null,
    driverRow: null,
    driverExists: false,
    driverApproved: false,
    driverApp: null,
    application: null,
    applicationStatus: null,
    transportType: null,
    allowedServices: [],
    error: null,
    lastResolvedUserId: user?.id || null,
    lastSessionFingerprint: null,
    lastReason: "empty",
  };
}

export function buildSessionFingerprint(session) {
  const userId = session?.user?.id || "anon";
  const accessTokenSuffix = session?.access_token ? String(session.access_token).slice(-12) : "none";
  return `${userId}:${accessTokenSuffix}`;
}

export async function resolveAuthSession(session, reason = "unknown") {
  return resolveAuthSessionState(session, reason);
}

export default {
  requestOtp,
  verifyOtp,
  signOut,
  getSession,
  getUser,
  onAuthStateChange,
  fetchProfileByUserId,
  upsertMinimalClientProfile,
  createEmptyAuthState,
  buildSessionFingerprint,
  resolveAuthSession,
  normalizeRole,
  normalizeStatus,
  deriveDriverApproved,
};
