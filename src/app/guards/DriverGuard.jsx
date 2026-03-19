import React, { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "../../modules/shared/components/Loader.jsx";
import { useAuth } from "../../modules/shared/auth/AuthProvider.jsx";
import { ROUTES } from "../router/routePaths.js";
import { selectAccessState } from "../../modules/shared/auth/accessState.js";

/**
 * DriverGuard.jsx
 *
 * - Defensively checks auth context and access state.
 * - Handles missing auth context, errors from selectAccessState, and loading state.
 * - Routes users to registration/pending pages or login based on driver status.
 * - Returns Loader while resolving, Navigate when redirecting, or Outlet when allowed.
 */

function DriverGuardComponent() {
  const location = useLocation();
  const auth = useAuth();

  const decision = useMemo(() => {
    // If auth context is missing, treat as loading to avoid throwing in render
    if (!auth) {
      console.error("[DriverGuard] auth context is missing. Ensure AuthProvider wraps the app.");
      return { mode: "loading", redirectTo: null, state: null };
    }

    let access;
    try {
      access = selectAccessState(auth) || { mode: "loading" };
    } catch (err) {
      console.error("[DriverGuard] selectAccessState threw an error:", err);
      // Fallback: redirect to login to be safe
      return {
        mode: "redirect",
        redirectTo: ROUTES.auth.login,
        state: { from: `${location.pathname}${location.search}${location.hash}` },
      };
    }

    const currentPath = String(location?.pathname || "");
    const onRegisterPage = currentPath === ROUTES.driver.register;
    const onPendingPage = currentPath === ROUTES.driver.pending;

    // Loading state
    if (access.mode === "loading") {
      return { mode: "loading", redirectTo: null, state: null };
    }

    // Not authenticated
    if (access.mode === "guest") {
      return {
        mode: "redirect",
        redirectTo: ROUTES.auth.login,
        state: { from: `${location.pathname}${location.search}${location.hash}` },
      };
    }

    // Admins and fully approved drivers allowed
    if (access.mode === "admin" || access.mode === "driver_approved") {
      return { mode: "allow", redirectTo: null, state: null };
    }

    // Driver pending approval
    if (access.mode === "driver_pending") {
      if (onPendingPage) {
        return { mode: "allow", redirectTo: null, state: null };
      }
      return {
        mode: "redirect",
        redirectTo: ROUTES.driver.pending,
        state: { from: `${location.pathname}${location.search}${location.hash}` },
      };
    }

    // Unregistered or rejected drivers should go to registration
    if (access.mode === "driver_unregistered" || access.mode === "driver_rejected") {
      if (onRegisterPage) {
        return { mode: "allow", redirectTo: null, state: null };
      }
      return {
        mode: "redirect",
        redirectTo: ROUTES.driver.register,
        state: { from: `${location.pathname}${location.search}${location.hash}` },
      };
    }

    // Default fallback: send to client home (safe fallback)
    return {
      mode: "redirect",
      redirectTo: ROUTES.client.home,
      state: { from: `${location.pathname}${location.search}${location.hash}` },
    };
  }, [auth, location.pathname, location.search, location.hash]);

  if (decision.mode === "loading") {
    return <Loader />;
  }

  if (decision.mode === "redirect") {
    return <Navigate replace to={decision.redirectTo} state={decision.state} />;
  }

  return <Outlet />;
}

const DriverGuard = React.memo(DriverGuardComponent);
export default DriverGuard;
