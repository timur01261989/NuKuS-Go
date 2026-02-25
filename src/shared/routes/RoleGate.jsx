import React, { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@/lib/supabase";
import { useSessionProfile } from "@shared/auth/useSessionProfile";

/**
 * Single source of truth: decide where user should land.
 *
 * Inputs are *already fetched* records (no DB calls here).
 */
export function pickHomeForRole({ role, driverRow, driverApplication }) {
  const r = (role || "client").toLowerCase();

  if (r === "admin") return "/admin";

  // If application exists, driver flow wins (pending/approved/rejected).
  if (driverApplication) {
    const st = (driverApplication.status || "pending").toLowerCase();

    const approved =
      !!driverRow &&
      (
        String(driverRow.status || "").toLowerCase() === "approved" ||
        driverRow.is_approved === true ||
        driverRow.approved === true
      );

    if (approved && st === "approved") return "/driver/dashboard";
    if (st === "rejected") return "/driver/register";

    // pending / approved-without-driver-row / unknown
    return "/driver/pending";
  }

  // Normal role routing
  if (r === "driver") {
    // If profile says driver but no application info, take them to register/pending entry.
    // App.jsx already redirects /driver -> /driver/dashboard, so be explicit here:
    return driverRow ? "/driver/dashboard" : "/driver/register";
  }

  return "/client/home";
}

/**
 * RoleGate
 * allow shape (as used in App.jsx):
 *   allow={{ client: true/false, driver: true/false, requireDriverApproved: true/false }}
 *
 * IMPORTANT:
 * - Never redirect while loading (prevents storms)
 * - Driver access is gated by drivers row approval (variant A)
 * - Driver flow can be enabled even if profiles.role is not set yet, if driver_application exists
 */
export default function RoleGate({ children, allow, redirectTo = "/login" }) {
  // If Supabase is not configured, fail softly (no infinite redirect).
  if (!supabase) {
    return (
      <div style={{ padding: 16 }}>
        Supabase konfiguratsiya topilmadi: <code>VITE_SUPABASE_URL</code> va <code>VITE_SUPABASE_ANON_KEY</code> ni tekshiring.
      </div>
    );
  }

  const location = useLocation();

  const a = useMemo(() => {
    const x = allow || {};
    return {
      client: !!x.client,
      driver: !!x.driver,
      requireDriverApproved: !!x.requireDriverApproved,
    };
  }, [allow]);

  const {
    loading,
    session,
    profile,
    role,
    isAdmin,
    driverRow,
    driverApproved,
    application,
    applicationStatus,
  } = useSessionProfile({ includeDriver: true, includeApplication: true });

  if (loading) {
    return (
      <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  // Effective role:
  // - Admin if profile says so
  // - Driver if profile says driver OR they have driver application (driver flow)
  // - Otherwise client
  let effectiveRole = (role || "client").toLowerCase();
  if (isAdmin) effectiveRole = "admin";
  if (application) effectiveRole = "driver";

  // Quick allow checks
  const wantsClient = a.client;
  const wantsDriver = a.driver;

  // Admin routes (if any) should use allow.driver/client false; but be safe:
  if (effectiveRole === "admin") {
    if (!wantsClient && !wantsDriver) return children;
    // If admin tries to access normal app routes, let them pass unless explicitly blocked.
    return children;
  }

  // If route expects driver only
  if (wantsDriver && !wantsClient) {
    if (effectiveRole !== "driver") {
      // Not in driver flow -> go to home
      const home = pickHomeForRole({ role: effectiveRole, driverRow, driverApplication: application });
      return <Navigate to={home} replace />;
    }

    // If approval is required, enforce it
    if (a.requireDriverApproved && !driverApproved) {
      // If application was rejected, send to register; else pending
      if (applicationStatus === "rejected") return <Navigate to="/driver/register" replace />;
      return <Navigate to="/driver/pending" replace />;
    }

    return children;
  }

  // If route expects client only
  if (wantsClient && !wantsDriver) {
    if (effectiveRole === "driver") {
      // Driver visiting client-only page: allow it? In this project, client pages are generally accessible to drivers too,
      // but if a route is explicitly client-only, send them to their home.
      const home = pickHomeForRole({ role: effectiveRole, driverRow, driverApplication: application });
      return <Navigate to={home} replace />;
    }
    return children;
  }

  // Mixed routes (client+driver) — allow both
  return children;
}
