/**
 * RoleGate.jsx - MINIMAL FIX VERSION
 * 
 * Location: src/shared/routes/RoleGate.jsx
 * 
 * FIX: Keep original structure, only add useAppMode context
 * DON'T change hook order or add new hooks
 */

import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@/lib/supabase";
import { useAppMode } from "@/providers/AppModeProvider"; // ✅ ADD IMPORT ONLY

// Shared helper: role → home route (exported for RootRedirect)
// Keep it deterministic: only uses already-fetched records.
export function pickHomeForRole({ role, driverRow, driverApplication, appMode }) {
  const r = (role || "client").toLowerCase();
  const mode = (appMode || "client").toLowerCase(); // ✅ USE appMode PARAMETER

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
  const { appMode } = useAppMode(); // ✅ ADD ONLY THIS (no reordering)
  const location = useLocation();
  
  // Keep original state hooks in same order
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [driverRow, setDriverRow] = useState(null);
  const [driverApplication, setDriverApplication] = useState(null);

  if (!supabase) {
    return (
      <div style={{ padding: 16 }}>
        <p>Error: Supabase not initialized.</p>
      </div>
    );
  }

  // Fetch user profile, driver, and application in parallel
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Get current user
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error("[RoleGate] Auth error:", authError);
          setRole(null);
          setLoading(false);
          return;
        }

        const user = authData?.user;
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        // Fetch profile, driver, and driver_applications in parallel
        const [profileRes, driverRes, appRes] = await Promise.all([
          supabase.from("profiles").select("role").eq("id", user.id).single(),
          supabase.from("drivers").select("*").eq("user_id", user.id).single(),
          supabase
            .from("driver_applications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single(),
        ]);

        const profileRole = profileRes.data?.role || "client";
        const driver = driverRes.error?.code === "PGRST116" ? null : driverRes.data;
        const app = appRes.error?.code === "PGRST116" ? null : appRes.data;

        setRole(profileRole);
        setDriverRow(driver);
        setDriverApplication(app);
      } catch (err) {
        console.error("[RoleGate] Fetch error:", err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  // If no role determined, redirect to login
  if (!role) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user has access
  const hasAccess = useMemo(() => {
    const isDriver = role.toLowerCase() === "driver";
    const isClient = role.toLowerCase() === "client";
    const isAdmin = role.toLowerCase() === "admin";

    // Check allow rules
    if (allow?.admin && isAdmin) return true;
    if (allow?.driver && isDriver) return true;
    if (allow?.client && isClient) return true;

    return false;
  }, [role, allow]); // ✅ KEEP ORIGINAL DEPENDENCIES

  // If not allowed, redirect to home for their role
  if (!hasAccess) {
    const nextRoute = pickHomeForRole({
      role,
      driverRow,
      driverApplication,
      appMode, // ✅ PASS appMode HERE
    });
    return <Navigate to={nextRoute} replace />;
  }

  // Allowed - render children
  return children;
}
