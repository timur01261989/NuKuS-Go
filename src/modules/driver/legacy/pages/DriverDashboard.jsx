import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const [gateLoading, setGateLoading] = useState(true);
  const [gateAllowed, setGateAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;

        const userId = authData?.user?.id;
        if (!userId) {
          console.warn("[DriverDashboard] No userId found, RoleGate handles redirect.");
          return;
        }

        if (isMounted) setGateAllowed(true);
      } catch (e) {
        console.error("[DriverDashboard] gate error:", e);
        // RoleGate handles redirect, avoid loops
      } finally {
        if (isMounted) setGateLoading(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[DriverDashboard] logout error:", err);
    } finally {
      // RoleGate handles redirect, avoid loops
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
 */
function LegacyDriverDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: "", avatarUrl: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const [isOnline, setIsOnline] = useState(() => {
    const v = localStorage.getItem("driverOnline");
    return v === "1";
  });

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) {
          console.warn("[LegacyDriverDashboard] No user found, RoleGate handles redirect.");
          return;
        }

        const data = await loadLegacyDriverDashboardProfile({
          onUnauthed: () => {
            console.warn("[LegacyDriverDashboard] Unauthed, RoleGate handles redirect.");
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
        console.error("[LegacyDriverDashboard] fetchProfile error:", err);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const toggleOnline = async (checked) => {
    try {
      await toggleDriverPresence({
        checked,
        setLoading,
        setIsOnline,
      });
    } catch (err) {
      console.error("[LegacyDriverDashboard] toggleOnline error:", err);
    }
  };

  const go = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
    } catch (err) {
      console.error("[LegacyDriverDashboard] logout error:", err);
    }
  };

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingBottom: 80 }}>
      <LegacyDashboardHeader profile={profile} onOpenMenu={() => setDrawerOpen(true)} />

      <LegacyDashboardStatusCard isOnline={isOnline} loading={loading} onToggle={toggleOnline} t={t} />

      <LegacyDashboardPrimaryMenu t={t} go={go} onLogout={handleLogout} />

      <LegacyDashboardDrawer
        drawerOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        profile={profile}
        go={go}
      />
    </div>
  );
}
