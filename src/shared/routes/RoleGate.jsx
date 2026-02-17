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
 * Notes:
 *  - RLS/policy sabab profile o‘qilmasa ham bu yerda "client"ga fallback QILMAYMIZ.
 *    Aks holda driver hech qachon driver bo‘lolmay qoladi.
 *  - Loading holatida redirect qilmaymiz (aks holda “loadingda qotish” va “flicker” bo‘ladi).
 */

// Promise’ni timeout bilan o‘rash (fetch’ni haqiqiy abort qilmaydi, lekin UI qotib qolmasin)
function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

export default function RoleGate({ children, allow, redirectTo = "/login" }) {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const [reason, setReason] = useState(null);

  // allow object har renderda yangi bo‘lib qolsa effect qayta-qayta ishlamasin
  const allowKey = useMemo(() => {
    const a = allow || {};
    return JSON.stringify({
      client: !!a.client,
      driver: !!a.driver,
      requireDriverApproved: !!a.requireDriverApproved,
    });
  }, [allow]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        if (!alive) return;

        setLoading(true);
        setReason(null);

        // 1) session
        const { data: s, error: sessionErr } = await withTimeout(
          supabase.auth.getSession()
        );

        if (!alive) return;

        if (sessionErr) {
          setOk(false);
          setReason("session-error");
          setLoading(false);
          return;
        }

        const session = s?.session;
        if (!session) {
          setOk(false);
          setReason("no-session");
          setLoading(false);
          return;
        }

        // 2) profile role (RLS bloklasa ham access bermaymiz)
        let role = null;
        let profileExists = false;

        const { data: profile, error: profileErr } = await withTimeout(
          supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle()
        );

        if (!alive) return;

        if (!profileErr && profile?.role) {
          profileExists = true;
          role = profile.role;
        } else {
          // profil yo‘q yoki o‘qib bo‘lmadi
          profileExists = false;
          role = null;
        }

        // 3) driver approved (faqat role driver bo‘lsa)
        let approved = false;
        if (role === "driver") {
          const { data: drv, error: drvErr } = await withTimeout(
            supabase
              .from("drivers")
              .select("approved")
              .eq("user_id", session.user.id)
              .maybeSingle()
          );

          if (!alive) return;

          if (!drvErr && typeof drv?.approved === "boolean") {
            approved = drv.approved;
          }
        }

        // 4) access decision
        const a = allow || {};

        if (!role) {
          setOk(false);
          setReason(profileExists ? "no-role" : "no-profile");
          setLoading(false);
          return;
        }

        let allowed = false;

        if (role === "client") {
          allowed = !!a.client;
        } else if (role === "driver") {
          if (!a.driver) {
            allowed = false;
            setReason("driver-not-allowed");
          } else if (a.requireDriverApproved && !approved) {
            allowed = false;
            setReason("driver-not-approved");
          } else {
            allowed = true;
          }
        } else {
          // noma’lum role
          allowed = false;
          setReason("unknown-role");
        }

        if (!alive) return;

        setOk(allowed);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setOk(false);
        setReason(e?.message === "timeout" ? "timeout" : "error");
        setLoading(false);
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [allowKey]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!ok) {
    // driver approved bo‘lmasa pendingga
    if (reason === "driver-not-approved") {
      return <Navigate to="/driver/pending" replace />;
    }

    // profil yo‘q bo‘lsa: odatda auth trigger yoki RLS muammo
    if (reason === "no-profile") {
      return (
        <Navigate
          to={redirectTo}
          replace
          state={{ from: location.pathname, reason: "no-profile" }}
        />
      );
    }

    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location.pathname, reason }}
      />
    );
  }

  return <>{children}</>;
}
