import React, { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "../../modules/shared/components/Loader.jsx";
import { useAuth } from "../../modules/shared/auth/AuthProvider.jsx";

function AuthGuardComponent() {
  const location = useLocation();
  const auth = useAuth();

  const guardState = useMemo(() => {
    const isLoading = !auth?.authReady || auth?.loading;
    const isAuthed = !!auth?.isAuthed && !!auth?.user;

    return {
      isLoading,
      isAuthed,
      redirectTo: isAuthed ? null : "/login",
      redirectState: isAuthed
        ? null
        : {
            from: `${location.pathname}${location.search}${location.hash}`,
          },
    };
  }, [auth?.authReady, auth?.isAuthed, auth?.loading, auth?.user, location.hash, location.pathname, location.search]);

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
