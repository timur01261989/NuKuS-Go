import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "../../modules/shared/components/Loader.jsx";
import { useAuth } from "../../modules/shared/auth/AuthProvider.jsx";

const PENDING_STATUSES = new Set(["pending", "review", "submitted", "processing"]);
const REJECTED_STATUSES = new Set(["rejected", "declined", "cancelled"]);
const APPROVED_STATUSES = new Set(["approved", "active", "verified", "enabled", "ok"]);

function normalizeStatus(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function DriverGuardComponent() {
  const location = useLocation();
  const auth = useAuth();
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    if (!auth?.loading && auth?.authReady) {
      setForceReady(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setForceReady(true);
      auth?.refetch?.().catch?.(() => {});
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [auth?.authReady, auth?.loading, auth?.refetch]);

  const decision = useMemo(() => {
    const isLoading = !forceReady && (!auth?.authReady || auth?.loading);
    const isAuthed = !!auth?.isAuthed && !!auth?.user;
    const status = normalizeStatus(auth?.applicationStatus);
    const hasApplication = !!auth?.application || !!auth?.driverApp || !!status;
    const isDriverRole = auth?.role === "driver" || !!auth?.driverExists;
    const isApproved = !!auth?.driverApproved || APPROVED_STATUSES.has(status);
    const isPending = !isApproved && PENDING_STATUSES.has(status);
    const isRejected = REJECTED_STATUSES.has(status);
    const currentPath = location.pathname;
    const onRegisterPage = currentPath === "/driver/register";
    const onPendingPage = currentPath === "/driver/pending";

    if (isLoading) {
      return { mode: "loading", redirectTo: null };
    }

    if (!isAuthed) {
      return {
        mode: "redirect",
        redirectTo: "/login",
        state: {
          from: `${location.pathname}${location.search}${location.hash}`,
        },
      };
    }

    if (!isDriverRole && !hasApplication) {
      return onRegisterPage
        ? { mode: "allow" }
        : { mode: "redirect", redirectTo: "/driver/register", state: { from: currentPath } };
    }

    if (isRejected) {
      return onRegisterPage
        ? { mode: "allow" }
        : { mode: "redirect", redirectTo: "/driver/register", state: { from: currentPath } };
    }

    if (isPending) {
      return onPendingPage
        ? { mode: "allow" }
        : { mode: "redirect", redirectTo: "/driver/pending", state: { from: currentPath } };
    }

    if (!isApproved) {
      return onRegisterPage
        ? { mode: "allow" }
        : { mode: "redirect", redirectTo: "/driver/register", state: { from: currentPath } };
    }

    if (onRegisterPage || onPendingPage) {
      return { mode: "redirect", redirectTo: "/driver", state: { from: currentPath } };
    }

    return { mode: "allow" };
  }, [
    auth?.application,
    auth?.applicationStatus,
    auth?.authReady,
    auth?.driverApp,
    auth?.driverApproved,
    auth?.driverExists,
    auth?.isAuthed,
    auth?.loading,
    auth?.role,
    auth?.user,
    location.hash,
    location.pathname,
    location.search,
    forceReady,
  ]);

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
