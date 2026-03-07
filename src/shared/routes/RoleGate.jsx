/**
 * RoleGate.jsx - FINAL FIXED VERSION
 * Location: src/shared/routes/RoleGate.jsx
 * 
 * FIX: Import and use useAppMode hook correctly
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppMode } from "@/providers/AppModeProvider"; // ✅ CRITICAL IMPORT
import { useUserStore } from "@/hooks/useUserStore";

export function pickHomeForRole({ role, driverRow, driverApplication, appMode }) {
  const r = (role || "client").toLowerCase();
  const mode = (appMode || "client").toLowerCase();

  if (r === "admin") return "/admin";
  if (mode !== "driver") return "/client/home";

  if (driverRow?.status === "approved") {
    return "/driver/dashboard";
  }

  if (
    driverApplication?.status === "pending" ||
    driverApplication?.status === "submitted"
  ) {
    return "/driver/pending";
  }

  return "/driver/register";
}

export default function RoleGate({ children, allow, redirectTo = "/login" }) {
  const { appMode } = useAppMode(); // ✅ GET appMode FROM CONTEXT
  const navigate = useNavigate();
  const location = useLocation();
  const { user, driverRow, driverApplication, loading } = useUserStore();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate(redirectTo, { state: { from: location } });
      return;
    }

    const role = (user.role || "client").toLowerCase();
    const isDriver = role === "driver";
    const hasPermission =
      (allow?.driver && isDriver) ||
      (allow?.client && !isDriver) ||
      (allow?.admin && role === "admin");

    if (!hasPermission) {
      const nextRoute = pickHomeForRole({
        role,
        driverRow,
        driverApplication,
        appMode,
      });
      navigate(nextRoute, { replace: true });
      return;
    }

    setHasAccess(true);
  }, [user, loading, navigate, location, allow, driverRow, driverApplication, appMode]); // ✅ appMode IN DEPENDENCIES

  if (loading) return <div>Yuklanmoqda...</div>;
  if (!hasAccess) return null;
  return children;
}
