import React, { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "../../modules/shared/components/Loader.jsx";
import { useAuth } from "../../modules/shared/auth/AuthProvider.jsx";
import { ROUTES } from "../router/routePaths.js";
import { selectAccessState } from "../../modules/shared/auth/accessState.js";

function AuthGuardComponent() {
  const location = useLocation();
  const auth = useAuth();

  const guardState = useMemo(() => {
    const access = selectAccessState(auth);

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
  }, [auth, location.hash, location.pathname, location.search]);

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
