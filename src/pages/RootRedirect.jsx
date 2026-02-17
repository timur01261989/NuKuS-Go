import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@lib/supabase";

/**
 * RootRedirect:
 *  - If no session => /login
 *  - If session => decide by role:
 *      client  => /client/home
 *      driver  => /driver/dashboard (or /driver/pending if not approved)
 *
 * NOTE: We intentionally block rendering of the public taxi map on "/"
 * because it bypasses login and causes confusing behavior on Vercel.
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

        // default role
        let role = "client";

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (!profileErr && profile?.role) role = profile.role;

        if (role === "driver") {
          // check approval if drivers table exists
          let approved = true;
          const { data: drv, error: drvErr } = await supabase
            .from("drivers")
            .select("approved")
            .eq("user_id", userId)
            .maybeSingle();

          if (!drvErr && typeof drv?.approved === "boolean") approved = drv.approved;

          setTo(approved ? "/driver/dashboard" : "/driver/pending");
        } else {
          setTo("/client/home");
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
