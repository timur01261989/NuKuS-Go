import { useMemo } from "react";
import { useAuth } from "@/shared/auth/AuthProvider";

/**
 * Thin selector hook over AuthProvider.
 * It never subscribes to Supabase directly.
 * That is the main fix against repeated auth/profile fetch loops.
 */
export function useSessionProfile(_options = {}) {
  const auth = useAuth();

  return useMemo(() => ({
    loading: auth.loading,
    authReady: auth.authReady,
    session: auth.session,
    user: auth.user,
    userId: auth.user?.id ?? null,
    profile: auth.profile,
    role: auth.role,
    isAdmin: auth.isAdmin,
    driver: auth.driver,
    driverRow: auth.driverRow,
    driverExists: auth.driverExists,
    driverApproved: auth.driverApproved,
    driverApp: auth.driverApp,
    application: auth.application,
    applicationStatus: auth.applicationStatus,
    error: auth.error,
    isAuthed: auth.isAuthed,
    refetch: auth.refetch,
    signOut: auth.signOut,
  }), [auth]);
}

export default useSessionProfile;
