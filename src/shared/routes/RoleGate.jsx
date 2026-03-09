import React, { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAppMode } from "@/providers/AppModeProvider";
import { useSessionProfile } from "@/shared/auth/useSessionProfile";

export function pickHomeForRole({ role, driverRow, driverApplication, appMode = "client" }) {
  const normalizedRole = String(role || "client").toLowerCase();
  const normalizedMode = String(appMode || "client").toLowerCase();
  const appStatus = String(driverApplication?.status || "").toLowerCase();

  const approved = !!driverRow && (
    driverRow.approved === true ||
    driverRow.is_approved === true ||
    ["approved", "active", "verified", "enabled", "ok"].includes(String(driverRow.status || "").toLowerCase())
  );

  if (normalizedRole === "admin") return "/admin";
  if (normalizedMode !== "driver") return "/client/home";

  if (normalizedRole !== "driver") {
    if (driverApplication || driverRow) return "/driver/register";
    return "/client/home";
  }

  if (approved || appStatus === "approved") return "/driver/dashboard";
  if (appStatus === "rejected") return "/driver/register";
  return "/driver/pending";
}

function Loader() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" tip="Yuklanmoqda..." />
    </div>
  );
}

export default function RoleGate({ children, allow, redirectTo = "/login" }) {
  const location = useLocation();
  const { appMode, isLoading: appModeLoading } = useAppMode();
  const {
    loading,
    authReady,
    session,
    role,
    driver,
    driverApproved,
    driverApp,
  } = useSessionProfile({ includeDriver: true, includeApplication: true });

  const decision = useMemo(() => {
    const rules = allow || {};

    if (appModeLoading || loading || !authReady) {
      return { kind: "loading" };
    }

    if (!session?.user) {
      return { kind: "redirect", to: redirectTo, state: { from: location } };
    }

    const currentRole = String(role || "client").toLowerCase();
    const appStatus = String(driverApp?.status || "").toLowerCase();
    const allowClient = !!rules.client;
    const allowDriver = !!rules.driver;
    const requireDriverApproved = !!rules.requireDriverApproved;
    const allowPending = !!rules.allowPending;

    if (currentRole === "admin") {
      return { kind: "allow" };
    }

    if (allowClient && currentRole === "client") {
      return { kind: "allow" };
    }

    if (allowClient && currentRole === "driver" && String(appMode || "client") !== "driver") {
      return { kind: "allow" };
    }

    if (allowDriver && currentRole === "driver") {
      if (!requireDriverApproved) {
        if (allowPending) return { kind: "allow" };
        return { kind: "allow" };
      }

      if (driverApproved) {
        return { kind: "allow" };
      }

      if (allowPending && ["pending", "submitted", "review", "approved", "rejected", ""].includes(appStatus)) {
        return { kind: "allow" };
      }

      return { kind: "redirect", to: "/driver/pending", state: { from: location } };
    }

    if (allowDriver && currentRole !== "driver") {
      if (driver || driverApp) {
        if (!requireDriverApproved || allowPending) {
          return { kind: "redirect", to: "/driver/register", state: { from: location } };
        }
        return { kind: "redirect", to: "/driver/pending", state: { from: location } };
      }
      return { kind: "redirect", to: "/driver/register", state: { from: location } };
    }

    if (allowClient) {
      return { kind: "redirect", to: "/client/home", state: { from: location } };
    }

    return { kind: "redirect", to: pickHomeForRole({ role: currentRole, driverRow: driver, driverApplication: driverApp, appMode }), state: { from: location } };
  }, [allow, appMode, appModeLoading, authReady, driver, driverApp, driverApproved, loading, location, redirectTo, role, session]);

  if (decision.kind === "loading") {
    return <Loader />;
  }

  if (decision.kind === "redirect") {
    return <Navigate to={decision.to} replace state={decision.state} />;
  }

  return children;
}
