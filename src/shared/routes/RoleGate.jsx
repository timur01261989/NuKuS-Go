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
 * Goal:
 *  - Build-safe (no syntax traps)
 *  - No "login flicker" while checking
 *  - If profile row is missing (common after OTP auth), try to create it for CLIENT routes.
 */
export default function RoleGate({ children, allow, redirectTo = "/login" }) {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const [reason, setReason] = useState(null);

  // allow object har renderda yangilanib effect qayta-qayta ishlamasin
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

        // 2) read profile.role
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

          // profile yo'q yoki RLS blokladi
          profileExists = false;
          role = null;
          return { profile: null, profileErr };
        };

        const { profileErr } = await readProfile();

        // 2.1) Agar CLIENT route bo'lsa va profile yo'q bo'lsa — profile yaratib ko'ramiz
        // Bu OTP auth'dan keyin eng ko'p uchraydigan muammo.
        if (!role && a.client && !a.driver) {
          try {
            // RLS policy kerak: authenticated user o'z id'si bilan insert/upsert qila olishi.
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
            // ignore, qayta o'qib ko'ramiz
          }

          await readProfile();
        }

        if (!role) {
          // profile yo'q bo'lsa driver/client routes'larda "loading→login flicker" bo'lmasin:
          // aniq reason bilan qaytaramiz
          return finish(false, profileErr ? "profile-error" : "no-profile");
        }

        // 3) driver approved
        let approved = false;
        if (role === "driver") {
          const { data: drv, error: drvErr } = await withTimeout(
            supabase.from("drivers").select("approved").eq("user_id", userId).maybeSingle()
          );
          if (!drvErr && typeof drv?.approved === "boolean") approved = drv.approved;
        }

        // 4) allow decision
        let allowed = false;

        if (role === "client") {
          allowed = !!a.client;
        } else if (role === "driver") {
          if (!a.driver) {
            allowed = false;
            setReason("driver-not-allowed");
          } else if (a.requireDriverApproved && !approved) {
            allowed = false;
            return finish(false, "driver-not-approved");
          } else {
            allowed = true;
          }
        }

        // extra info
        if (!profileExists && a.driver && !allowed) {
          // driver flow bo'lishi mumkin, lekin profil yo'q — admin/trigger muammo
          setReason((r) => r || "no-profile");
        }

        return finish(allowed, allowed ? null : "not-allowed");
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
    if (reason === "driver-not-approved") {
      return <Navigate to="/driver/pending" replace />;
    }

    // profile yo'q yoki RLS/DB muammo bo'lsa — login emas, register flow ham bo'lishi mumkin.
    // Lekin hozircha xavfsiz: login sahifasiga qaytaramiz va reason uzatamiz.
    return <Navigate to={redirectTo} replace state={{ from: location.pathname, reason }} />;
  }

  return <>{children}</>;
}
