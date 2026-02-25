import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@/lib/supabase";

// Shared helper: role → home route (exported for RootRedirect)
// Keep it deterministic: only uses already-fetched records.
export function pickHomeForRole({ role, driverRow, driverApplication }) {
  const r = (role || "client").toLowerCase();
  const mode = (localStorage.getItem("app_mode") || "client").toLowerCase();

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
  if (!supabase) {
    return (
      <div style={{ padding: 16 }}>
        Supabase konfiguratsiya topilmadi: <code>VITE_SUPABASE_URL</code> va <code>VITE_SUPABASE_ANON_KEY</code> ni tekshiring.
      </div>
    );
  }

  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const [reason, setReason] = useState(null);

  const allowKey = useMemo(() => {
    const a = allow || {};
    return JSON.stringify({
      client: !!a.client,
      driver: !!a.driver,
      requireDriverApproved: !!a.requireDriverApproved,
    });
  }, [allow]);

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

        const session = s?.session;
        if (!session) return finish(false, "no-session");

        const userId = session.user.id;

        // 2) Parallel so'rovlar: profile + driver_applications + drivers (agar kerak bo'lsa)
        // Bu ketma-ket so'rovlar o'rniga parallel ishlaydi — ~2x tez
        const profilePromise = withTimeout(
          (async () => {
            let res = await supabase
              .from("profiles")
              .select("role")
              .eq("id", userId)
              .maybeSingle();

            // Fallback: some schemas use profiles.user_id instead of profiles.id
            if (res.error && (res.error.code === "42703" || /column\s+\"id\"\s+does\s+not\s+exist/i.test(res.error.message || ""))) {
              res = await supabase
                .from("profiles")
                .select("role")
                .eq("user_id", userId)
                .maybeSingle();
            }
            return res;
          })()
        );

        const appPromise = withTimeout(
          supabase
            .from("driver_applications")
            .select("status")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        ).catch(() => ({ data: null, error: null }));

        const drvPromise = a.driver
          ? withTimeout(
              supabase.from("drivers").select("*").eq("user_id", userId).maybeSingle()
            ).catch(() => ({ data: null, error: null }))
          : Promise.resolve({ data: null, error: null });

        // Barcha so'rovlarni parallel yuborish
        const [profileRes, appRes, drvRes] = await Promise.all([profilePromise, appPromise, drvPromise]);

        // Profile
        let profileRole = null;
        let profileExists = false;
        let profileErr = null;

        if (!profileRes.error && profileRes.data?.role) {
          profileExists = true;
          profileRole = profileRes.data.role;
        }
        profileErr = profileRes.error;

        // Driver application
        let applicationStatus = null;
        if (!appRes.error && appRes.data) {
          if (typeof appRes.data.status === "string") {
            applicationStatus = appRes.data.status.trim().toLowerCase();
          }
        }

        // Driver row
        let driverRowExists = false;
        let approved = false;
        if (!drvRes.error && drvRes.data) {
          driverRowExists = true;
          approved = deriveDriverApproved(drvRes.data);
        }

        // 3) Derive effective role
        // Role is always taken from profiles.role.
        // IMPORTANT: must be mutable because we may auto-create a profile below.
        let effectiveRole = profileRole;

        // 4) Auto-create client profile if accessing client-only route and profile missing
        if (!effectiveRole && a.client && !a.driver) {
          try {
            await withTimeout(
              supabase
                .from("profiles")
                .upsert(
                  {
                    id: userId,
                    role: "client",
                    phone: session.user.phone ?? null,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "id" }
                )
            );
          } catch {
            // ignore
          }

          // Prevent login<->home redirect loops: assume the intended role locally,
          // then best-effort confirm it from DB.
          effectiveRole = "client";

          const { data: p2 } = await withTimeout(
            supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
          );
          if (p2?.role) {
            profileRole = p2.role;
            effectiveRole = p2.role;
          }
        }

        // 5) Decide allow
        // ⭐ CRITICAL: allowPending applies to ALL roles
        // This is the /driver/pending route - allow immediately regardless of role
        if (a.allowPending) {
          return finish(true, null); // ✅ ALLOW /driver/pending FOR ANYONE WITH PENDING STATUS
        }

        if (effectiveRole === "client") {
          // IMPORTANT:
          // This project historically forgets to set profiles.role='driver'.
          // If the user has a driver application (pending/approved), we must still
          // allow driver routes (pending/home) instead of bouncing them back to client.
          if (applicationStatus === "pending" || applicationStatus === "approved") {
            if (location.pathname === "/driver/pending") return finish(true, null);
            if (location.pathname === "/driver/home") {
              // If driver row exists → allow; otherwise send to pending.
              if (driverRowExists) return finish(true, null);
              return finish(false, "driver-not-approved");
            }
            // Any other driver-only route should redirect to pending.
            if (!!a.driver && !a.client) return finish(false, "driver-not-approved");
          }

          if (!!a.client) return finish(true, null);

          // Client trying to access driver-only route
          if (!!a.driver && !a.client) return finish(false, "not-driver");

          return finish(false, "not-allowed");
        }

        if (effectiveRole === "driver") {
          // ⭐ CRITICAL: allowPending takes PRIORITY
          // This is for /driver/pending route - allow ALL pending drivers
          if (a.allowPending) {
            return finish(true, null); // ✅ ALLOW PENDING DRIVERS ON /driver/pending
          }

          // ⭐ FIRST CHECK: If route allows BOTH client and driver, 
          // ALWAYS allow (even pending drivers on client routes)
          if (a.driver && a.client) {
            return finish(true, null); // ✅ ALLOW PENDING ON CLIENT ROUTES
          }

          // Drivers should still be allowed to open client-only pages.
          if (!a.driver && a.client) return finish(true, null);
          if (!a.driver) return finish(false, "driver-not-allowed");

          // ⭐ EXPLICIT: If still pending and accessing /client/home, allow
          if (applicationStatus === "pending" && a.client) {
            return finish(true, null); // ✅ ALLOW PENDING DRIVERS ON CLIENT ROUTES
          }

          if (!driverRowExists) {
            // Variant A: driver access is based on `drivers` row.
            if (applicationStatus && ["pending", "submitted", "waiting", "review", "approved"].includes(applicationStatus)) {
              // If route is driver-only and they're pending, deny
              if (a.driver && !a.client) {
                return finish(false, "driver-not-approved");
              }
              // Route allows both would have been caught above
            }
            return finish(false, "driver-not-registered");
          }

          // approval gating (driver dashboard/orders)
          if (a.requireDriverApproved) {
            if (!approved) return finish(false, "driver-not-approved");
          }

          return finish(true, null);
        }

        // No role at all
        // For driver routes: send to register. For others: login.
        if (a.driver && !a.client) {
          if (applicationStatus === "pending") return finish(false, "driver-not-approved");
          return finish(false, "driver-not-registered");
        }

        if (!profileExists && profileErr) return finish(false, "profile-error");
        return finish(false, "no-profile");
      } catch (e) {
        return finish(false, e?.message === "timeout" ? "timeout" : "error");
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [allowKey, location.pathname]);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!ok) {
    if (reason === "driver-not-approved") return <Navigate to="/driver/pending" replace />;
    if (reason === "driver-not-registered" || reason === "not-driver") return <Navigate to="/driver/register" replace />;

    return <Navigate to={redirectTo} replace state={{ from: location.pathname, reason }} />;
  }

  return <>{children}</>;
}