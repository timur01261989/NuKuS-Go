import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@/lib/supabase";

/**
 * RootRedirect:
 *  - No session => /login
 *  - Session => role/status based landing
 *
 * Why this exists:
 *  In production, many users remain profiles.role='client' even after driver application is submitted/approved.
 *  If we always redirect to /client/home, drivers get pulled back to client pages right after login.
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

        // Fetch profile role
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
        const role = profile?.role || "client";

        // Fetch driver application status (used even when role is still 'client')
        const { data: driverApp } = await supabase
          .from("driver_applications")
          .select("status")
          .eq("user_id", userId)
          .maybeSingle();
        const status = driverApp?.status || null;

        // Decide landing
        if (role === "admin") {
          setTo("/superpro");
        } else if (status === "pending" || status === "submitted" || status === "waiting" || status === "review") {
          setTo("/driver/pending");
        } else if (status === "approved" || role === "driver") {
          setTo("/driver/dashboard");
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
