import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@/lib/supabase";

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

        // 2) profile role (best-effort)
        let profileRole = null;
        let profileExists = false;

        const { data: profile, error: profileErr } = await withTimeout(
          supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
        );

        if (!profileErr && profile?.role) {
          profileExists = true;
          profileRole = profile.role;
        }

        // 3) driver row (source of truth for driver access)
        let driverRow = null;
        let driverRowExists = false;
        let approved = false;

        // Only hit drivers table when it matters (driver routes OR mixed allow)
        if (a.driver) {
          const { data: drv, error: drvErr } = await withTimeout(
            // IMPORTANT: the project uses multiple schema variants for `drivers`.
            // Selecting a missing column (e.g. `approved`) triggers PGRST204 and causes redirect loops.
            // So we select("*") and derive approval from available fields.
            supabase.from("drivers").select("*").eq("user_id", userId).maybeSingle()
          );

          if (!drvErr && drv) {
            driverRow = drv;
            driverRowExists = true;
            approved = deriveDriverApproved(drv);
          }
        }

        // 4) Derive effective role
        // Role is always taken from profiles.role.
        // Drivers table is used to determine registration/approval only.
        const effectiveRole = profileRole;

        // 5) Auto-create client profile if accessing client-only route and profile missing
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

          const { data: p2 } = await withTimeout(
            supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
          );
          if (p2?.role) profileRole = p2.role;
        }

        // 6) Decide allow
        if (effectiveRole === "client") {
          if (!!a.client) return finish(true, null);

          // Client trying to access driver-only route
          if (!!a.driver && !a.client) return finish(false, "not-driver");

          return finish(false, "not-allowed");
        }

        if (effectiveRole === "driver") {
          // Drivers should still be allowed to open client pages.
          if (!a.driver && a.client) return finish(true, null);
          if (!a.driver) return finish(false, "driver-not-allowed");

          if (!driverRowExists) return finish(false, "driver-not-registered");

          // approval gating (driver dashboard/orders)
          if (a.requireDriverApproved) {
            if (!approved) return finish(false, "driver-not-approved");
          }

          return finish(true, null);
        }

        // No role at all
        // For driver routes: send to register. For others: login.
        if (a.driver && !a.client) return finish(false, "driver-not-registered");

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
