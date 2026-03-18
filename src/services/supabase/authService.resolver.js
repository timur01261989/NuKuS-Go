import { fetchDriverCore } from "../../modules/shared/auth/driverCoreAccess.js";
import {
  deriveDriverApproved,
  normalizeRole,
  normalizeStatus,
  withTimeout,
} from "./authService.helpers.js";
import {
  createEmptyAuthState,
  buildSessionFingerprint,
  fetchProfileByUserId,
  upsertMinimalClientProfile,
} from "./authService.js";

export async function resolveAuthSessionState(session, reason = "unknown") {
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
    withTimeout(fetchProfileByUserId(userId), 6000, () => ({ data: null, error: new Error("profile lookup timeout") })),
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
