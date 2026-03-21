import React, { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Loader from "../../components/Loader.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { ROUTES } from "@/app/router/routePaths.js";
import { pickHomeForAuth, selectAccessState } from "../../auth/accessState.js";

export function pickHomeForRole(auth, options = {}) {
  const appMode = typeof options === "string" ? options : options?.appMode;
  return pickHomeForAuth(auth, appMode);
}

export default function RoleGate({ children, allow, redirectTo = ROUTES.auth.login }) {
  const location = useLocation();
  const auth = useAuth();

  const decision = useMemo(() => {
    const allowConfig = allow || {};
    const access = selectAccessState(auth);

    if (access.mode === "loading") {
      return { mode: "loading", target: null };
    }

    if (access.mode === "guest") {
      return {
        mode: "redirect",
        target: redirectTo,
        state: { from: `${location.pathname}${location.search}${location.hash}` },
      };
    }

    if (access.mode === "admin") {
      return { mode: "allow" };
    }

    const allowClient = !!allowConfig.client;
    const allowDriver = !!allowConfig.driver;
    const requireDriverApproved = !!allowConfig.requireDriverApproved;
    const homeTarget = pickHomeForAuth(auth, allowConfig.appMode);

    if (access.mode === "driver_approved") {
      if (!allowDriver) {
        return { mode: "redirect", target: homeTarget };
      }
      return { mode: "allow" };
    }

    if (access.mode === "driver_pending" || access.mode === "driver_rejected" || access.mode === "driver_unregistered") {
      if (!allowDriver) {
        return { mode: "redirect", target: homeTarget };
      }
      if (requireDriverApproved) {
        return { mode: "redirect", target: homeTarget };
      }
      return { mode: "allow" };
    }

    if (!allowClient) {
      return { mode: "redirect", target: homeTarget };
    }

    return { mode: "allow" };
  }, [allow, auth, location.hash, location.pathname, location.search, redirectTo]);

  if (decision.mode === "loading") {
    return <Loader />;
  }

  if (decision.mode === "redirect") {
    return <Navigate replace to={decision.target} state={decision.state} />;
  }

  return children;
}
