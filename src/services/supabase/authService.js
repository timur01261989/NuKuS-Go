import { supabase, assertSupabase } from "./supabaseClient.js";
import { fetchDriverCore } from "../../modules/shared/auth/driverCoreAccess.js";

async function maybeSelectSingle(table, columns, filters = []) {
  let query = supabase.from(table).select(columns);
  for (const filter of filters) {
    if (filter?.op === 'eq') {
      query = query.eq(filter.column, filter.value);
    }
  }
  return query.maybeSingle();
}

async function tryProfileSelect(userId, selectors) {
  let lastError = null;
  for (const selector of selectors) {
    const result = await maybeSelectSingle('profiles', selector, [{ op: 'eq', column: 'id', value: userId }]);
    if (!result.error) {
      return { data: result.data ?? null, error: null };
    }

    lastError = result.error;
    const message = String(result.error?.message || '').toLowerCase();
    if (!message.includes('column')) {
      return { data: null, error: result.error };
    }
  }
  return { data: null, error: lastError };
}

function withTimeout(promise, ms, fallbackFactory) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallbackFactory()), ms);
    }),
  ]);
}

export function normalizeRole(value) {
  const role = String(value || "client").trim().toLowerCase();
  if (["admin", "driver", "client"].includes(role)) {
    return role;
  }
  return "client";
}

export function normalizeStatus(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

export function deriveDriverApproved(driver) {
  if (!driver) return false;

  if (typeof driver.approved === "boolean") return driver.approved;
  if (typeof driver.is_approved === "boolean") return driver.is_approved;

  const status = normalizeStatus(driver.status);
  if (status) {
    return ["approved", "active", "verified", "enabled", "ok"].includes(status);
  }

  return true;
}

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
  return supabase.auth.getSession();
}

export async function getUser() {
  assertSupabase();
  return supabase.auth.getUser();
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
  const requestedSession = session ?? null;
  const user = requestedSession?.user ?? null;

  if (!user?.id) {
    return {
      ...createEmptyAuthState(null),
      loading: false,
      authReady: true,
      isAuthed: false,
      lastResolvedUserId: null,
      lastSessionFingerprint: null,
      lastReason: reason,
    };
  }

  const userId = user.id;
  const fingerprint = buildSessionFingerprint(requestedSession);

  const [profileResult, driverCore] = await Promise.all([
    withTimeout(fetchProfileByUserId(userId), 6000, () => ({ data: null, error: new Error('profile lookup timeout') })),
    withTimeout(fetchDriverCore(userId), 6000, () => null),
  ]);

  let profile = profileResult.data ?? null;
  let profileError = profileResult.error ?? null;

  if (!profile && !profileError) {
    const createdProfile = await upsertMinimalClientProfile(user);
    profile = createdProfile.data ?? null;
    profileError = createdProfile.error ?? null;
  }

  const driverRow = driverCore
    ? {
        user_id: userId,
        approved: !!driverCore.driverApproved,
        is_verified: !!driverCore.driverApproved,
        allowed_services: driverCore.allowedServices || [],
        transport_type:
          driverCore.activeVehicle?.vehicle_type || driverCore.application?.requested_vehicle_type || null,
      }
    : null;

  const driverApp = driverCore?.application ?? null;
  const role = normalizeRole(profile?.role || (driverApp ? "driver" : "client"));
  const isAdmin = !!profile?.is_admin;
  const applicationStatus = normalizeStatus(driverApp?.status);
  const driverApproved = !!driverCore?.driverApproved || deriveDriverApproved(driverRow);
  const allowedServices = Array.isArray(driverCore?.allowedServices) ? driverCore.allowedServices : [];
  const transportType =
    driverCore?.activeVehicle?.vehicle_type ||
    driverApp?.requested_vehicle_type ||
    driverApp?.transport_type ||
    null;

  return {
    loading: false,
    authReady: true,
    isAuthed: true,
    session: requestedSession,
    user,
    profile,
    role,
    isAdmin,
    driver: driverRow,
    driverRow,
    driverExists: !!driverRow,
    driverApproved,
    driverApp,
    application: driverApp,
    applicationStatus,
    transportType,
    allowedServices,
    error: profileError,
    lastResolvedUserId: userId,
    lastSessionFingerprint: fingerprint,
    lastReason: reason,
  };
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
