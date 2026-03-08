import React, { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAppMode } from "@/providers/AppModeProvider";
import { useSessionProfile } from "@/shared/auth/useSessionProfile";

export function pickHomeForRole({ role, driverRow, driverApplication, appMode = "client" }) {
  const mode = String(appMode || "client").toLowerCase();
  const normalizedRole = String(role || "client").toLowerCase();
  const appStatus = String(driverApplication?.status || "").toLowerCase();
  const driverApproved = !!driverRow?.is_verified;

  if (normalizedRole === "admin") return "/admin";
  if (mode !== "driver") return "/client/home";
  if (driverApproved) return "/driver/dashboard";
  if (!driverApplication) return "/driver/register";
  if (appStatus === "approved") return "/driver/dashboard";
  if (appStatus === "rejected" || appStatus === "revoked") return "/driver/register";
  return "/driver/pending";
}

export default function RoleGate({ children, allow, redirectTo = "/login" }) {
  const location = useLocation();
  const { appMode, isLoading: appModeLoading } = useAppMode();
  const {
    loading,
    session,
    role,
    driverRow,
    application,
  } = useSessionProfile({ includeDriver: true, includeApplication: true });

  const target = useMemo(() => {
    const a = allow || {};
    const driverApproved = !!driverRow?.is_verified;
    const applicationStatus = String(application?.status || "").toLowerCase();
    const effectiveRole = String(role || "client").toLowerCase();

    if (!session) return { ok: false, to: redirectTo };

    if (a.driver) {
      if (driverApproved) return { ok: true };
      if (a.requireDriverApproved) {
        if (!application) return { ok: false, to: "/driver/register" };
        if (applicationStatus === "approved") return { ok: true };
        return { ok: false, to: "/driver/pending" };
      }
      if (application || effectiveRole === "driver") return { ok: true };
      return { ok: false, to: "/driver/register" };
    }

    if (a.client) return { ok: true };
    return { ok: false, to: "/client/home" };
  }, [allow, application, driverRow, redirectTo, role, session]);

  if (loading || appModeLoading) {
    return (
      <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!target.ok) {
    return <Navigate to={target.to} replace state={{ from: location.pathname, appMode }} />;
  }

  return children;
}
