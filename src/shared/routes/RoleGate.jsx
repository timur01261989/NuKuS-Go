import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAppMode } from "@/providers/AppModeProvider";
import { useSessionProfile } from "@/shared/auth/useSessionProfile";

const AUTH_LOADING_TIMEOUT_MS = 7000;

function clearStaleSupabaseStorage() {
  if (typeof window === "undefined") return;

  try {
    const localKeys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key) localKeys.push(key);
    }

    localKeys.forEach((key) => {
      const normalized = String(key || "").toLowerCase();
      if (
        normalized.includes("supabase") ||
        normalized.startsWith("sb-") ||
        normalized.includes("auth-token")
      ) {
        window.localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("[RoleGate] localStorage cleanup skipped:", error);
  }

  try {
    const sessionKeys = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key) sessionKeys.push(key);
    }

    sessionKeys.forEach((key) => {
      const normalized = String(key || "").toLowerCase();
      if (
        normalized.includes("supabase") ||
        normalized.startsWith("sb-") ||
        normalized.includes("auth-token")
      ) {
        window.sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("[RoleGate] sessionStorage cleanup skipped:", error);
  }
}

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

  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    if (!loading && !appModeLoading) {
      setAuthTimedOut(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      console.error("[RoleGate] Auth bootstrap timed out. Redirecting to login.");
      clearStaleSupabaseStorage();
      setAuthTimedOut(true);
    }, AUTH_LOADING_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [appModeLoading, loading]);

  const target = useMemo(() => {
    const a = allow || {};
    const driverApproved = !!driverRow?.is_verified;
    const applicationStatus = String(application?.status || "").toLowerCase();
    const effectiveRole = String(role || "client").toLowerCase();

    if (authTimedOut) return { ok: false, to: redirectTo };
    if (!session) return { ok: false, to: redirectTo };

    if (a.admin) {
      if (effectiveRole === "admin") return { ok: true };
      return { ok: false, to: pickHomeForRole({ role, driverRow, driverApplication: application, appMode }) };
    }

    if (Array.isArray(a.roles) && a.roles.length > 0) {
      const allowedRoles = a.roles.map((item) => String(item || "").toLowerCase());
      if (allowedRoles.includes(effectiveRole)) return { ok: true };
      return { ok: false, to: pickHomeForRole({ role, driverRow, driverApplication: application, appMode }) };
    }

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
  }, [allow, appMode, application, authTimedOut, driverRow, redirectTo, role, session]);

  if ((loading || appModeLoading) && !authTimedOut) {
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
