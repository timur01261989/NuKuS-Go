/**
 * RoleGate.jsx - FINAL CORRECTED VERSION
 * 
 * Location: src/shared/routes/RoleGate.jsx
 * 
 * FIX: Use useAppMode() context instead of localStorage
 * NO useUserStore import (doesn't exist!)
 */

import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@/lib/supabase";
import { useAppMode } from "@/providers/AppModeProvider"; // ✅ CORRECT IMPORT

// Shared helper: role → home route (exported for RootRedirect)
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
 */
export default function RoleGate({ children, allow, redirectTo = "/login" }) {
  const { appMode } = useAppMode(); // ✅ GET appMode FROM CONTEXT
  const location = useLocation();
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

  // Fetch user data
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Get current user
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error("Auth error:", authError);
          setLoading(false);
          return;
        }

        const user = authData?.user;
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch profile, driver, and application in parallel
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

        // Extract data
        const profileRole = profileRes.data?.role || "client";
        const driver = driverRes.error?.code === "PGRST116" ? null : driverRes.data;
        const app = appRes.error?.code === "PGRST116" ? null : appRes.data;

        setRole(profileRole);
        setDriverRow(driver);
        setDriverApplication(app);
      } catch (error) {
        console.error("RoleGate error:", error);
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

  // Check authorization
  const hasAccess = useMemo(() => {
    if (!role) return false;

    const isDriver = role.toLowerCase() === "driver";
    const isClient = role.toLowerCase() === "client";
    const isAdmin = role.toLowerCase() === "admin";

    // Check allow rules
    if (allow?.admin && isAdmin) return true;
    if (allow?.driver && isDriver) return true;
    if (allow?.client && isClient) return true;

    // If no specific rules, deny
    return false;
  }, [role, allow]);

  // If not allowed, redirect to appropriate home
  if (!hasAccess) {
    const nextRoute = pickHomeForRole({
      role,
      driverRow,
      driverApplication,
      appMode, // ✅ PASS appMode TO FUNCTION
    });
    return <Navigate to={nextRoute} replace />;
  }

  // Allowed - render children
  return children;
}
