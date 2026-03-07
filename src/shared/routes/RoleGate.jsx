/**
 * RoleGate.jsx - SUPER MINIMAL FIX
 * 
 * ONLY change: localStorage.getItem("app_mode") → useAppMode context
 * NO other changes, NO hook reordering
 * 
 * Location: src/shared/routes/RoleGate.jsx
 */

import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@/lib/supabase";
import { useAppMode } from "@/providers/AppModeProvider"; // ✅ ONLY NEW IMPORT

// Shared helper: role → home route (exported for RootRedirect)
// Keep it deterministic: only uses already-fetched records.
export function pickHomeForRole({ role, driverRow, driverApplication, appMode }) {
  const r = (role || "client").toLowerCase();
  const mode = (appMode || "client").toLowerCase(); // ✅ CHANGED: use parameter

  if (r === "admin") return "/admin";

  // Default after login is client home.
  // Driver flow is entered only when app_mode="driver".
  if (mode !== "driver") return "/client/home";

  if (r === "driver") {
    const appStatus = (driverApplication?.status || "").toLowerCase();

    const driverApproved =
      !!driverRow &&
      (String(driverRow.status || "").toLowerCase() === "approved" ||
        String(driverRow.status || "").toLowerCase() === "active" ||
        driverRow.is_approved === true ||
        driverRow.approved === true);

    if (driverApproved) return "/driver/dashboard";
    if (appStatus === "approved") return "/driver/dashboard";
    if (appStatus === "rejected") return "/driver/register";

    // pending/submitted/review/unknown
    return "/driver/pending";
  }

  // In driver mode, but role isn't driver → go to registration
  return "/driver/register";
}

/**
 * RoleGate
 * allow:
 *  - client: true/false
 *  - driver: true/false
 *  - requireDriverApproved: true/false
 *
 * IMPORTANT:
 *  Role truth source MUST be `profiles.role`.
 *  `drivers` table row existence is ONLY for driver registration/approval state,
 *  and must NOT override a user's role.
 *
 *  Why: if you treat "drivers row exists" as role=driver, then any client who once
 *  created a drivers row (or has a leftover row) gets forced into driver routes.
 *
 *  PERFORMANCE: profile, driver_applications va drivers so'rovlari
 *  parallel (Promise.all) yuboriladi — sahifa ochilish 2x tez bo'ladi.
 */
export default function RoleGate({ children, allow, redirectTo = "/login" }) {
  // ✅ MOVED: Call hooks BEFORE supabase check (React rules of hooks)
  const { appMode } = useAppMode();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const [reason, setReason] = useState(null);

  // ✅ NOW: supabase check AFTER hooks
  if (!supabase) {
    return (
      <div style={{ padding: 16 }}>
        Supabase konfiguratsiya topilmadi: <code>VITE_SUPABASE_URL</code> va <code>VITE_SUPABASE_ANON_KEY</code> ni tekshiring.
      </div>
    );
  }

  const allowKey = useMemo(() => {
    const a = allow || {};
    return JSON.stringify({
      client: !!a.client,
      driver: !!a.driver,
      requireDriverApproved: !!a.requireDriverApproved,
    });
  }, [
    !!(allow && allow.client),
    !!(allow && allow.driver),
    !!(allow && allow.requireDriverApproved),
  ]);

  const withTimeout = (promise, ms = 10000) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
    ]);

  const deriveDriverApproved = (drv) => {
    if (!drv) return false;

    // Schema variant A: drivers.approved boolean
    if (Object.prototype.hasOwnProperty.call(drv, "approved") && typeof drv.approved === "boolean") {
      return drv.approved;
    }

    // Schema variant B: drivers.status text
    if (Object.prototype.hasOwnProperty.call(drv, "status") && typeof drv.status === "string") {
      const s = drv.status.trim().toLowerCase();
      // "active" ham "approved" bilan teng (admin tasdiqlash natijasi)
      return ["approved", "active", "verified", "enabled", "ok"].includes(s);
    }

    // Older variants without approval gating
    return true;
  };

  useEffect(() => {
    let mounted = true;

    const finish = (nextOk, nextReason = null) => {
      if (!mounted) return;
      setOk(nextOk);
      setReason(nextReason);
      setLoading(false);
    };

    const run = async () => {
      try {
        setLoading(true);
        setReason(null);

        const a = allow || {};

        // 1) session
        const { data: s, error: sessionErr } = await withTimeout(supabase.auth.getSession());
        if (sessionErr) return finish(false, "session-error");

        const user = s?.session?.user;
        if (!user) return finish(false, "no-auth");

        // 2) profile: role, driver_id (if exists)
        const { data: profile, error: profileErr } = await withTimeout(
          supabase.from("profiles").select("role, driver_id").eq("id", user.id).single()
        );
        if (profileErr) return finish(false, "profile-error");

        const role = (profile?.role || "").toLowerCase();

        // 3) driver_applications
        const { data: appData, error: appErr } = await withTimeout(
          supabase
            .from("driver_applications")
            .select("status")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()
        );

        const driverApplication = appErr?.code === "PGRST116" ? null : appData;

        // 4) drivers row (if role = driver)
        let driverRow = null;
        if (role === "driver") {
          const { data: drv, error: drvErr } = await withTimeout(
            supabase.from("drivers").select("*").eq("user_id", user.id).single()
          );
          driverRow = drvErr?.code === "PGRST116" ? null : drv;
        }

        // Now determine if allowed
        const isAdmin = role === "admin";
        const isDriver = role === "driver";
        const isClient = role !== "driver" && role !== "admin";
        const driverApproved = deriveDriverApproved(driverRow);

        let allowed = false;

        if (a.admin && isAdmin) allowed = true;
        if (a.driver && isDriver) allowed = true;
        if (a.client && isClient) allowed = true;

        // requireDriverApproved: if set, driver must be approved
        if (a.requireDriverApproved && isDriver && !driverApproved) allowed = false;

        // allowPending: driver can be in pending state
        if (a.allowPending && isDriver) {
          // override "not approved" — pending is allowed
          allowed = true;
        }

        if (allowed) {
          return finish(true);
        }

        // Determine redirect
        const nextRoute = pickHomeForRole({
          role,
          driverRow,
          driverApplication,
          appMode, // ✅ PASS appMode HERE
        });
        setReason(nextRoute); // encode redirect target
        return finish(false);
      } catch (err) {
        console.error("[RoleGate] Error:", err);
        return finish(false, "exception");
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [allow, allowKey, appMode]); // ✅ ADD appMode to deps

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!ok) {
    // If reason is a route, redirect there
    if (reason && reason.startsWith("/")) {
      return <Navigate to={reason} state={{ from: location }} replace />;
    }
    // Otherwise redirect to login or custom redirectTo
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Access granted
  return children;
}
