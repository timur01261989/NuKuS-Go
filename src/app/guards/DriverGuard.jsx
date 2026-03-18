import React, { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "../../modules/shared/components/Loader.jsx";
import { useAuth } from "../../modules/shared/auth/AuthProvider.jsx";
import { ROUTES } from "../router/routePaths.js";
import { selectAccessState } from "../../modules/shared/auth/accessState.js";

function DriverGuardComponent() {
  const location = useLocation();
  const auth = useAuth();

  const decision = useMemo(() => {
    const access = selectAccessState(auth);
    const currentPath = location.pathname;
    const onRegisterPage = currentPath === ROUTES.driver.register;
    const onPendingPage = currentPath === ROUTES.driver.pending;

    if (access.mode === "loading") {
      return { mode: "loading", redirectTo: null };
    }

    if (access.mode === "guest") {
      return {
        mode: "redirect",
        redirectTo: ROUTES.auth.login,
        state: { from: `${location.pathname}${location.search}${location.hash}` },
      };
    }

    if (access.mode === "admin" || access.mode === "driver_approved") {
      return { mode: "allow", redirectTo: null };
    }

    if (access.mode === "driver_pending") {
      if (onPendingPage) {
        return { mode: "allow", redirectTo: null };
      }
      return { mode: "redirect", redirectTo: ROUTES.driver.pending, state: null };
    }

    if (access.mode === "driver_unregistered" || access.mode === "driver_rejected") {
      if (onRegisterPage) {
        return { mode: "allow", redirectTo: null };
      }
      return { mode: "redirect", redirectTo: ROUTES.driver.register, state: null };
    }

    return { mode: "redirect", redirectTo: ROUTES.client.home, state: null };
  }, [auth, location.hash, location.pathname, location.search]);

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
