import { useMemo } from "react";
import { useAuth } from "../modules/shared/auth/AuthProvider.jsx";

export function useAuthStore(selector) {
  const authState = useAuth();

  return useMemo(() => {
    if (typeof selector !== "function") {
      return authState;
    }
    return selector(authState);
  }, [authState, selector]);
}

export function selectAuthStatus(state) {
  return {
    loading: !!state?.loading,
    authReady: !!state?.authReady,
    isAuthed: !!state?.isAuthed,
    role: state?.role || null,
    isAdmin: !!state?.isAdmin,
  };
}

export function selectDriverAccess(state) {
  return {
    role: state?.role || null,
    driverExists: !!state?.driverExists,
    driverApproved: !!state?.driverApproved,
    applicationStatus: state?.applicationStatus || null,
    allowedServices: Array.isArray(state?.allowedServices) ? state.allowedServices : [],
    transportType: state?.transportType || null,
  };
}

export { useAuth };
export default useAuthStore;
