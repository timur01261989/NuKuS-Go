import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@/lib/supabase";

/**
 * RootRedirect:
 *  - No session => /login
 *  - Session => /client/home (default).
 *
 * NOTE:
 *  Even if user is a driver, they should still be able to stay on client side.
 *  Driver routes are accessed only when user explicitly navigates to /driver/*.
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

        // Default landing after login: client home.
        // Driver dashboard is accessed only from explicit /driver/* navigation.
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
