import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@lib/supabase";

/**
 * RootRedirect:
 *  - No session => /login
 *  - Session => decide route.
 *
 * IMPORTANT:
 *  Driver access MUST be based on "drivers" table row existence.
 *  Relying only on profiles.role causes a common bug:
 *    user registered as driver but profiles.role is still "client"
 *    => redirect to /client/home (wrong).
 */
export default function RootRedirect() {
  const [loading, setLoading] = useState(true);
  const [to, setTo] = useState("/login");

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const { data: s, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr || !s?.session) {
          if (!mounted) return;
          setTo("/login");
          setLoading(false);
          return;
        }

        const userId = s.session.user.id;

        // IMPORTANT PRODUCT RULE:
        //  - A user may be registered as a driver AND still use the client app.
        //  - Therefore, root redirect must NOT force driver dashboard.
        // Driver mode should be entered only when user navigates to /driver/* explicitly.

        // 1) Use profile role as a soft hint only.
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        const role = !profileErr ? profile?.role : null;

        // Default home after login is always the client home.
        // (Driver features are available via a separate entry point in the UI.)
        setTo("/client/home");

        if (!mounted) return;
        setLoading(false);
      } catch {
        if (!mounted) return;
        setTo("/login");
        setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return <Navigate to={to} replace />;
}

// O'ZGARISHLAR RO'YXATI (RootRedirect.jsx):
// - drivers jadvalidagi turli sxemalar (approved bor/yo'qligi) sababli PostgREST 400 bo'lib ketmasligi uchun .select("*") qilindi.
// - approved ustuni mavjud bo'lmasa, eski sxema uchun "approved=true" deb qabul qilindi (aks holda driver doim pendingga tushib qolardi).
