import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAppMode } from "@/providers/AppModeProvider";
import { useSessionProfile } from "@/shared/auth/useSessionProfile";

const AUTH_LOADING_TIMEOUT_MS = 8000;

function clearStaleSupabaseStorage() {
  if (typeof window === "undefined") return;

  const clearStore = (store) => {
    try {
      const keys = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key) keys.push(key);
      }

      keys.forEach((key) => {
        const normalized = String(key || "").toLowerCase();
        if (
          normalized.includes("supabase") ||
          normalized.startsWith("sb-") ||
          normalized.includes("auth-token") ||
          normalized.includes("refresh-token")
        ) {
          store.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("[RoleGate] storage cleanup skipped:", error);
    }
  };

  clearStore(window.localStorage);
  clearStore(window.sessionStorage);
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
  const { loading, session, role, driverRow, application } = useSessionProfile({
    includeDriver: true,
    includeApplication: true,
  });

  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    console.log("[RoleGate] render state", {
      pathname: location.pathname,
      appMode,
      appModeLoading,
      loading,
      hasSession: !!session,
      role,
      hasDriver: !!driverRow,
      hasApplication: !!application,
      authTimedOut,
      allow,
    });
  }, [allow, appMode, appModeLoading, application, authTimedOut, driverRow, loading, location.pathname, role, session]);

  useEffect(() => {
    if (!loading && !appModeLoading) {
      setAuthTimedOut(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      console.error("[RoleGate] auth bootstrap timed out; forcing safe logout.", {
        pathname: location.pathname,
        appMode,
        appModeLoading,
        loading,
        hasSession: !!session,
      });
      clearStaleSupabaseStorage();
      setAuthTimedOut(true);
    }, AUTH_LOADING_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [appMode, appModeLoading, loading, location.pathname, session]);

  const target = useMemo(() => {
    const rules = allow || {};
    const effectiveRole = String(role || "client").toLowerCase();
    const driverApproved = !!driverRow?.is_verified;
    const applicationStatus = String(application?.status || "").toLowerCase();

    if (authTimedOut) {
      return { ok: false, to: redirectTo, reason: "auth-timeout" };
    }

    if (!session) {
      return { ok: false, to: redirectTo, reason: "no-session" };
    }

    if (rules.admin) {
      if (effectiveRole === "admin") return { ok: true, reason: "admin-allowed" };
      return {
        ok: false,
        to: pickHomeForRole({ role, driverRow, driverApplication: application, appMode }),
        reason: "admin-denied",
      };
    }

    if (Array.isArray(rules.roles) && rules.roles.length > 0) {
      const normalizedRoles = rules.roles.map((item) => String(item || "").toLowerCase());
      if (normalizedRoles.includes(effectiveRole)) return { ok: true, reason: "role-allowed" };
      return {
        ok: false,
        to: pickHomeForRole({ role, driverRow, driverApplication: application, appMode }),
        reason: "role-denied",
      };
    }

    if (rules.driver) {
      if (driverApproved) return { ok: true, reason: "driver-approved" };

      if (rules.requireDriverApproved) {
        if (!application) return { ok: false, to: "/driver/register", reason: "driver-no-application" };
        if (applicationStatus === "approved") return { ok: true, reason: "application-approved" };
        return { ok: false, to: "/driver/pending", reason: `application-${applicationStatus || "pending"}` };
      }

      if (application || effectiveRole === "driver") return { ok: true, reason: "driver-basic-allowed" };
      return { ok: false, to: "/driver/register", reason: "driver-basic-denied" };
    }

    if (rules.client) {
      return { ok: true, reason: "client-allowed" };
    }

    return {
      ok: false,
      to: pickHomeForRole({ role, driverRow, driverApplication: application, appMode }),
      reason: "fallback-redirect",
    };
  }, [allow, appMode, application, authTimedOut, driverRow, redirectTo, role, session]);

  useEffect(() => {
    console.log("[RoleGate] target resolved", {
      pathname: location.pathname,
      target,
    });
  }, [location.pathname, target]);

  if ((loading || appModeLoading) && !authTimedOut) {
    return (
      <div
        style={{
          minHeight: "50vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!target.ok) {
    return <Navigate to={target.to} replace state={{ from: location.pathname, appMode }} />;
  }

  return children;
}
