/**
 * RoleGate.jsx - MINIMAL FIX
 * CHANGE: localStorage.getItem("app_mode") → useAppMode() hook
 * Location: src/shared/routes/RoleGate.jsx
 */

import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@/lib/supabase";
import { useAppMode } from "@/providers/AppModeProvider"; // ✅ ADD THIS IMPORT

export function pickHomeForRole({ role, driverRow, driverApplication, appMode }) {
  const r = (role || "client").toLowerCase();
  const mode = (appMode || "client").toLowerCase(); // ✅ CHANGED: use appMode parameter

  if (r === "admin") return "/admin";

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

    return "/driver/pending";
  }

  return "/driver/register";
}

export default function RoleGate({ children, allow, redirectTo = "/login" }) {
  // ✅ MOVED: Hooks BEFORE supabase check (React Rules of Hooks)
  const { appMode } = useAppMode();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const [reason, setReason] = useState(null);

  // ✅ NOW: supabase check AFTER hooks
  if (!supabase) {
    return (
      <div style={{ padding: 16 }}>
        Supabase konfiguratsiya topilmadi
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

  const deriveDriverApproved = (drv) => {
    if (!drv) return false;
    if (Object.prototype.hasOwnProperty.call(drv, "approved") && typeof drv.approved === "boolean") {
      return drv.approved;
    }
    if (Object.prototype.hasOwnProperty.call(drv, "status") && typeof drv.status === "string") {
      const s = drv.status.trim().toLowerCase();
      return ["approved", "active", "verified", "enabled", "ok"].includes(s);
    }
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

        const { data: s, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) return finish(false, "session-error");

        const user = s?.session?.user;
        if (!user) return finish(false, "no-auth");

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role, driver_id")
          .eq("id", user.id)
          .single();
        if (profileErr) return finish(false, "profile-error");

        const role = (profile?.role || "").toLowerCase();

        const { data: appData, error: appErr } = await supabase
          .from("driver_applications")
          .select("status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const driverApplication = appErr?.code === "PGRST116" ? null : appData;

        let driverRow = null;
        if (role === "driver") {
          const { data: drv, error: drvErr } = await supabase
            .from("drivers")
            .select("*")
            .eq("user_id", user.id)
            .single();
          driverRow = drvErr?.code === "PGRST116" ? null : drv;
        }

        const isAdmin = role === "admin";
        const isDriver = role === "driver";
        const isClient = role !== "driver" && role !== "admin";
        const driverApproved = deriveDriverApproved(driverRow);

        let allowed = false;

        if (a.admin && isAdmin) allowed = true;
        if (a.driver && isDriver) allowed = true;
        if (a.client && isClient) allowed = true;

        if (a.requireDriverApproved && isDriver && !driverApproved) allowed = false;

        if (a.allowPending && isDriver) {
          allowed = true;
        }

        if (allowed) {
          return finish(true);
        }

        // ✅ PASS appMode to pickHomeForRole
        const nextRoute = pickHomeForRole({
          role,
          driverRow,
          driverApplication,
          appMode,
        });
        setReason(nextRoute);
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
    if (reason && reason.startsWith("/")) {
      return <Navigate to={reason} state={{ from: location }} replace />;
    }
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
}
