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

        // 1) If drivers row exists => driver flow (even if profiles.role says client)
        const { data: drv, error: drvErr } = await supabase
          .from("drivers")
          // `drivers` jadvalida `status` ustuni yo'q.
          // `status` ni select qilish PostgREST 400 (Bad Request) beradi va driver redirect noto'g'ri ishlaydi.
          .select("approved,user_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (!drvErr && drv) {
          const approvedBool = typeof drv.approved === "boolean" ? drv.approved : false;
          setTo(approvedBool ? "/driver/dashboard" : "/driver/pending");
          if (!mounted) return;
          setLoading(false);
          return;
        }

        // 2) Fallback to profile role
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        const role = !profileErr ? profile?.role : null;

        if (role === "driver") {
          // If profile says driver but no drivers row, send to register to avoid loops
          setTo("/driver/register");
        } else if (role === "client") {
          setTo("/client/home");
        } else {
          setTo("/login");
        }

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
