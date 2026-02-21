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

        // IMPORTANT PRODUCT RULE:
        // Foydalanuvchi driver bo'lsa ham, default ochilish client/home bo'lishi kerak.
        // Driver sahifaga o'tish faqat user /driver/* ga o'zi kirganda (menyudan) bo'ladi.
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
