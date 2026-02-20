import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@lib/supabase";

/**
 * RoleGate
 * allow:
 *  - client: true/false
 *  - driver: true/false
 *  - requireDriverApproved: true/false
 *
 * IMPORTANT:
 *  - Do NOT rely only on profiles.role for driver access.
 *    In this project the real source of truth for "driver" is the `drivers` table.
 *    Otherwise driver users get redirected back to client forever.
 */
export default function RoleGate({ children, allow, redirectTo = "/login" }) {
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

  const withTimeout = (promise, ms = 8000) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
    ]);

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

        // 1) session
        const { data: s, error: sessionErr } = await withTimeout(supabase.auth.getSession());
        if (sessionErr) return finish(false, "session-error");

        const session = s?.session;
        if (!session) return finish(false, "no-session");

        const userId = session.user.id;
        const a = allow || {};

        // 2) Try read profiles.role (nice to have, but not mandatory for driver)
        let role = null;
        let profileExists = false;

        const readProfile = async () => {
          const { data: profile, error: profileErr } = await withTimeout(
            supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
          );
          if (!profileErr && profile?.role) {
            profileExists = true;
            role = profile.role;
            return { profile, profileErr: null };
          }
          profileExists = false;
          role = null;
          return { profile: null, profileErr };
        };

        const { profileErr } = await readProfile();

        // 2.1) If accessing CLIENT-only route and profile missing, try to create CLIENT profile
        if (!role && a.client && !a.driver) {
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
          await readProfile();
        }

        // 3) Driver table is source of truth
        // We query drivers row whenever driver access is involved OR role is missing.
        let driverRow = null;
        let driverRowExists = false;
        let approved = false;

        const shouldCheckDriver =
          !!a.driver || role === "driver" || (!role && (a.driver || a.client));

        if (shouldCheckDriver) {
          const { data: drv, error: drvErr } = await withTimeout(
            supabase.from("drivers").select("approved,status").eq("user_id", userId).maybeSingle()
          );

          if (!drvErr && drv) {
            driverRow = drv;
            driverRowExists = true;

            // approved flag OR status
            if (typeof drv.approved === "boolean") approved = drv.approved;
            const st = String(drv.status || "").toLowerCase();
            if (!approved && (st === "active" || st === "approved")) approved = true;
          }
        }

        // If profile role is missing but driver row exists, treat as DRIVER.
        if (!role && driverRowExists) role = "driver";

        // If role says "client" but driver row exists and route needs driver -> treat as driver.
        if (role === "client" && driverRowExists && a.driver && !a.client) {
          role = "driver";
        }

        // 4) decisions
        if (a.driver && !a.client) {
          // DRIVER-only route
          if (!driverRowExists) return finish(false, "driver-not-registered");
          if (a.requireDriverApproved && !approved) return finish(false, "driver-not-approved");
          return finish(true, null);
        }

        if (a.client && !a.driver) {
          // CLIENT-only route
          if (role === "client") return finish(true, null);

          // if driver is trying to open client-only route, allow only if client allowed (it is),
          // but many apps prefer redirect driver to dashboard. We'll keep behavior strict:
          return finish(false, "driver-on-client-route");
        }

        // Mixed route (client: true, driver: true) e.g. /driver/register
        if (a.client && a.driver) {
          // any logged-in user can access
          return finish(true, null);
        }

        // fallback: if nothing allowed, deny
        if (!profileExists && profileErr) return finish(false, "profile-error");
        return finish(false, "not-allowed");
      } catch (e) {
        return finish(false, e?.message === "timeout" ? "timeout" : "error");
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [allowKey]);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!ok) {
    if (reason === "driver-not-approved") return <Navigate to="/driver/pending" replace />;
    if (reason === "driver-not-registered") return <Navigate to="/driver/register" replace />;

    // Default
    return <Navigate to={redirectTo} replace state={{ from: location.pathname, reason }} />;
  }

  return <>{children}</>;
}
