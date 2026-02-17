import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@lib/supabase";

/**
 * allow:
 *  - client: true/false
 *  - driver: true/false
 *  - requireDriverApproved: true/false
 */
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
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setReason(null);

        const withTimeout = (p, ms = 8000) =>
          Promise.race([
            p,
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
          ]);

        const { data: s, error: sessionErr } = await withTimeout(supabase.auth.getSession());
        if (sessionErr) {
          if (!mounted) return;
          setOk(false);
          setReason("session-error");
          setLoading(false);
          return;
        }

        const session = s?.session;
        if (!session) {
          if (!mounted) return;
          setOk(false);
          setReason("no-session");
          setLoading(false);
          return;
        }

        // defaults
        let role = null;
        let approved = false;
        let profileExists = false;

        // profiles bo‘lmasligi yoki RLS bloklashi mumkin
        const { data: profile, error: profileErr } = await withTimeout(supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()
         );

        if (!profileErr && profile && profile.role) {
          profileExists = true;
          role = profile.role;
        } else {
          // profil yo‘q yoki o‘qib bo‘lmadi: bu holatda access bermaymiz
          profileExists = false;
          role = null;
        }

        // driver approval: drivers table'dan tekshiramiz (schema bilan mos)
        if (role === "driver") {
          const { data: drv, error: drvErr } = await withTimeout(supabase
            .from("drivers")
            .select("approved")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!drvErr && typeof drv?.approved === "boolean") {
            approved = drv.approved;
          }
        }
// access decision
        const a = allow || {};

        if (!role) {
          if (!mounted) return;
          setOk(false);
          setReason("no-profile");
          setLoading(false);
          return;
        }
        let allowed = false;

        if (role === "client") {
          allowed = !!a.client;
        }

        if (role === "driver") {
          if (!a.driver) {
            allowed = false;
            if (!mounted) return;
            setReason("driver-not-allowed");
          } else if (a.requireDriverApproved && !approved) {
            allowed = false;
            if (!mounted) return;
            setReason("driver-not-approved");
          } else {
            allowed = true;
          }
        }

        // Agar profile yo‘q bo‘lsa va siz driver route ochmoqchi bo‘lsangiz,
        // bu ko‘pincha DB’da profile yaratish triggeri yo‘qligidan bo‘ladi.
        // Shuni reason bilan ajratib qo‘yamiz:
        if (!profileExists && a.driver) {
          // user driver bo‘lishi kerak bo‘lgan flow bo‘lishi mumkin
          // ammo profil yo‘q => client fallback ishladi => noto‘g‘ri redirect bo‘ladi.
          // Siz xohlasangiz bu holatda /driver-mode ga yuborish mumkin.
          if (!allowed) {
            setReason((r) => r || "no-profile");
          }
        }

        if (!mounted) return;
        setOk(allowed);
        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setOk(false);
        setReason(e?.message === "timeout" ? "timeout" : "error");
        setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [allowKey]);

  // ✅ loading paytida oq ekran emas, spinner
  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!ok) {
    // driver approved bo‘lmasa pendingga
    if (reason === "driver-not-approved") {
      return <Navigate to="/driver/pending" replace />;
    }

    // profil yo‘q bo‘lsa, driver roli set qilinmagan bo‘lishi mumkin:
    // xohlasangiz driver-mode (ro‘yxatdan o‘tish / rol tanlash)ga yuboring
    if (reason === "no-profile") {
      return <Navigate to={redirectTo} replace state={{ from: location.pathname, reason: "no-profile" }} />;
    }

    // login redirect (oldingi pathni state’da olib boramiz)
    return <Navigate to={redirectTo} replace state={{ from: location.pathname, reason }} />;
  }

  return <>{children}</>;
}
