import { useMemo } from "react";
import { useAuth } from "./AuthProvider.jsx";

export function useSessionProfile(options = {}) {
  const { includeDriver = true, includeApplication = true } = options;
  const auth = useAuth();

  return useMemo(() => ({
    ...auth,
    driverRow: includeDriver ? auth?.driverRow ?? null : null,
    driver: includeDriver ? auth?.driver ?? null : null,
    driverExists: includeDriver ? !!auth?.driverExists : false,
    driverApproved: includeDriver ? !!auth?.driverApproved : false,
    application: includeApplication ? auth?.application ?? null : null,
    driverApp: includeApplication ? auth?.driverApp ?? null : null,
    applicationStatus: includeApplication ? auth?.applicationStatus ?? null : null,
    transportType: includeDriver ? auth?.transportType ?? null : null,
    allowedServices: includeDriver ? auth?.allowedServices ?? [] : [],
  }), [
    auth,
    includeApplication,
    includeDriver,
  ]);
}
