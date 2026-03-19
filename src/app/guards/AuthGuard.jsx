import React, { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "../../modules/shared/components/Loader.jsx";
import { useAuth } from "../../modules/shared/auth/AuthProvider.jsx";
import { ROUTES } from "../router/routePaths.js";
import { selectAccessState } from "../../modules/shared/auth/accessState.js";

/**
 * AuthGuard.jsx
 *
 * - Defensively checks auth context and access state.
 * - Handles missing auth context, errors from selectAccessState, and loading state.
 * - Returns Loader while resolving, Navigate to login when unauthenticated, or Outlet when allowed.
 */

function AuthGuardComponent() {
  const location = useLocation();
  const auth = useAuth();

  const guardState = useMemo(() => {
    // If auth context is missing, treat as loading to avoid throwing in render
    if (!auth) {
      console.error("[AuthGuard] auth context is missing. Ensure AuthProvider wraps the app.");
      return { isLoading: true, isAuthed: false, redirectTo: null, redirectState: null };
    }

    try {
      const access = selectAccessState(auth) || { mode: "loading" };

      // If access is still resolving, show loader
      if (access.mode === "loading") {
        return { isLoading: true, isAuthed: false, redirectTo: null, redirectState: null };
      }

      const isAuthed = access.mode !== "guest";

      return {
        isLoading: false,
        isAuthed,
        redirectTo: isAuthed ? null : ROUTES.auth.login,
        redirectState: isAuthed
          ? null
          : {
              from: `${location.pathname}${location.search}${location.hash}`,
            },
      };
    } catch (err) {
      // If selectAccessState throws, log and fallback to safe redirect to login
      console.error("[AuthGuard] selectAccessState error:", err);
      return {
        isLoading: false,
        isAuthed: false,
        redirectTo: ROUTES.auth.login,
        redirectState: {
          from: `${location.pathname}${location.search}${location.hash}`,
        },
      };
    }
  }, [auth, location.pathname, location.search, location.hash]);

  if (guardState.isLoading) {
    return <Loader />;
  }

  if (!guardState.isAuthed) {
    return <Navigate replace to={guardState.redirectTo} state={guardState.redirectState} />;
  }

  return <Outlet />;
}

const AuthGuard = React.memo(AuthGuardComponent);
export default AuthGuard;
