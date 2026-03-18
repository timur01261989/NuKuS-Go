import React, { useEffect, useState } from "react";
import { Button } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient.js";
import { useLanguage } from "../../../shared/i18n/useLanguage";
import DriverHome from "../components/DriverHome";
import { DriverOnlineProvider } from "../core/DriverOnlineContext";


import {
  loadLegacyDriverDashboardProfile,
  toggleDriverPresence,
  LegacyDashboardHeader,
  LegacyDashboardStatusCard,
  LegacyDashboardPrimaryMenu,
  LegacyDashboardDrawer,
} from "./driverDashboard.helpers.jsx";

export default function DriverDashboard() {
  const navigate = useNavigate();

  // Gate: driver must have an application before accessing dashboard
  const [gateLoading, setGateLoading] = useState(false);
  const [gateAllowed, setGateAllowed] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // RoleGate already enforces driver access.
    // Dashboard should not perform extra redirects (prevents redirect loops).
    const run = async () => {
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;

        const userId = authData?.user?.id;
        if (!userId) {
          // NOTE: RoleGate handles auth redirects. Avoid redirect loops here.
          // navigate("/login", { replace: true });
          return;
        }

        if (isMounted) setGateAllowed(true);
      } catch (e) {
        console.error("Driver dashboard gate error:", e);
        // NOTE: RoleGate handles auth redirects. Avoid redirect loops here.
        // navigate("/login", { replace: true });
      } finally {
        if (isMounted) setGateLoading(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  /**
   * Driver bosh sahifada xizmatlar (Shahar ichida / Viloyatlar aro / Tumanlar aro / Eltish / Yuk tashish)
   * ko‘rinishi kerak. Hozirgi oqimda Drawer-menu asosidagi dashboard o‘rniga
   * DriverHome (xizmatlar menyusi) ko‘rsatiladi.
   *
   * Eski dashboard kodi pastda qoldirilgan (o‘chirilmadi) — keyin qayta yoqish mumkin.
   */
  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // Logoutdan keyin client home'ga yuborish "rol aralashuvi" va redirect loop keltirib chiqarishi mumkin.
      // Eng toza oqim: login sahifasiga qaytish.
      // NOTE: RoleGate handles auth redirects. Avoid redirect loops here.
      // navigate("/login", { replace: true });
    }
  };

  if (gateLoading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        Yuklanmoqda...
      </div>
    );
  }

  if (!gateAllowed) {
    // Redirect is in progress
    return null;
  }

  return (
    <DriverOnlineProvider>
      <DriverHome onLogout={onLogout} />
    </DriverOnlineProvider>
  );
}

/**
 * LegacyDriverDashboard
 * Old dashboard implementation preserved for reference.
 * Not used by default to avoid hook/TDZ issues and runtime crashes.
 */
function LegacyDriverDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // keep location referenced so linter/build optimizers don't rewrite unexpectedly
  void location;

  // =========================
  // STATE
  // =========================
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: "", avatarUrl: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const [isOnline, setIsOnline] = useState(() => {
    const v = localStorage.getItem("driverOnline");
    return v === "1";
  });

  // =========================
  // 1. MA'LUMOTLARNI YUKLASH
  // =========================
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          // NOTE: RoleGate handles auth redirects. Avoid redirect loops here.
          // navigate("/login", { replace: true });
          return;
        }

        const data = await loadLegacyDriverDashboardProfile({
          onUnauthed: () => {
            // navigate("/login", { replace: true });
          },
        });

        if (mounted && data) {
          setProfile({
            fullName: data.fullName,
            phone: data.phone,
            avatarUrl: data.avatarUrl,
          });

          setIsOnline(data.onlineStatus);
          localStorage.setItem("driverOnline", data.onlineStatus ? "1" : "0");
        }
      } catch (err) {
        console.error("Kutilmagan xato:", err);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =========================
  // 2. ONLINE / OFFLINE TUGMASI (TUZATILDI)
  // =========================
  const toggleOnline = async (checked) => {
    await toggleDriverPresence({
      checked,
      setLoading,
      setIsOnline,
    });
  };

  // =========================
  // 3. SAHIFA OTISH
  // =========================
  const go = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    // navigate("/login");
  };

  // =========================
  // 4. RENDER
  // =========================
  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingBottom: 80 }}>
      <LegacyDashboardHeader profile={profile} onOpenMenu={() => setDrawerOpen(true)} />

      <LegacyDashboardStatusCard isOnline={isOnline} loading={loading} onToggle={toggleOnline} t={t} />

      <LegacyDashboardPrimaryMenu t={t} go={go} onLogout={handleLogout} />

      <LegacyDashboardDrawer drawerOpen={drawerOpen} onClose={() => setDrawerOpen(false)} profile={profile} go={go} />
    </div>
  );
}
