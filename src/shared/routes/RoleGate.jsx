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
  
  // Agar foydalanuvchi Driver rejimiga o'tmoqchi bo'lsa
  if (mode === "driver") {
    if (driverApproved || appStatus === "approved") return "/driver/dashboard";
    if (appStatus === "pending") return "/driver/pending";
    return "/driver/register"; // Ariza yo'q yoki rad etilgan bo'lsa
  }

  // Qolgan barcha holatlarda (mijoz rejimi)
  return "/client/home";
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
    if (!loading && !appModeLoading) {
      setAuthTimedOut(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      console.error("[RoleGate] auth bootstrap timed out; forcing safe logout.");
      clearStaleSupabaseStorage();
      setAuthTimedOut(true);
    }, AUTH_LOADING_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [appModeLoading, loading]);

  const target = useMemo(() => {
    const rules = allow || {};
    const effectiveRole = String(role || "client").toLowerCase();
    const driverApproved = !!driverRow?.is_verified;
    const applicationStatus = String(application?.status || "").toLowerCase();

    if (authTimedOut) {
      return { ok: false, to: redirectTo };
    }

    if (!session) {
      return { ok: false, to: redirectTo };
    }

    if (rules.admin) {
      if (effectiveRole === "admin") return { ok: true };
      return {
        ok: false,
        to: pickHomeForRole({ role, driverRow, driverApplication: application, appMode }),
      };
    }

    if (Array.isArray(rules.roles) && rules.roles.length > 0) {
      const normalizedRoles = rules.roles.map((item) => String(item || "").toLowerCase());
      if (normalizedRoles.includes(effectiveRole)) return { ok: true };
      return {
        ok: false,
        to: pickHomeForRole({ role, driverRow, driverApplication: application, appMode }),
      };
    }

    // QAT'IY HAYDOVCHI TEKSHIRUVI (Darvozabon mantiqi)
    if (rules.driver) {
      // 1. Agar admin tasdiqlagan bo'lsa - KIRA OLADI
      if (driverApproved || applicationStatus === "approved") {
        return { ok: true };
      }

      // 2. Agar ariza kutyotgan bo'lsa - KUTISH ZALIGA YUBORILADI
      if (applicationStatus === "pending") {
        return { ok: false, to: "/driver/pending" };
      }

      // 3. Qolgan barcha holatlarda (ariza yo'q yoki rad etilgan) - RO'YXATDAN O'TISHGA YUBORILADI
      return { ok: false, to: "/driver/register" };
    }

    if (rules.client) {
      return { ok: true };
    }

    return {
      ok: false,
      to: pickHomeForRole({ role, driverRow, driverApplication: application, appMode }),
    };
  }, [allow, appMode, application, authTimedOut, driverRow, redirectTo, role, session]);

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