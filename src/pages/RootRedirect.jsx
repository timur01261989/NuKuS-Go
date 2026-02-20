import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@lib/supabase";

/**
 * RootRedirect:
 *  - If no session => /login
 *  - If session => decide by DRIVER row first (source of truth):
 *      if drivers row exists:
 *         approved => /driver/dashboard
 *         not approved => /driver/pending
 *      else => /client/home
 *
 * Why: profiles.role is often missing or still "client" even for real drivers.
 * Relying on profiles.role creates an endless redirect back to client.
 */
export default function RootRedirect() {
  const [loading, setLoading] = useState(true);
  const [to, setTo] = useState("/login");

  useEffect(() => {
    let mounted = true;

    const done = (path) => {
      if (!mounted) return;
      setTo(path);
      setLoading(false);
    };

    const run = async () => {
      try {
        const { data: s, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr || !s?.session) return done("/login");

        const userId = s.session.user.id;

        // 1) Check drivers row first
        const { data: drv, error: drvErr } = await supabase
          .from("drivers")
          .select("approved,status")
          .eq("user_id", userId)
          .maybeSingle();

        if (!drvErr && drv) {
          let approved = true;
          if (typeof drv.approved === "boolean") approved = drv.approved;
          const st = String(drv.status || "").toLowerCase();
          if (!approved && (st === "active" || st === "approved")) approved = true;

          return done(approved ? "/driver/dashboard" : "/driver/pending");
        }

        // 2) Fallback to client
        return done("/client/home");
      } catch {
        return done("/login");
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
