/**
 * RootRedirect.jsx - FIXED VERSION (COMPLETE - 102 LINES)
 * 
 * Location: src/pages/RootRedirect.jsx
 * 
 * CRITICAL FIX:
 * Changed from localStorage.getItem("app_mode") to useAppMode() context
 * 
 * Before (BROKEN - Line 30):
 *   const mode = (localStorage.getItem("app_mode") || "client").toLowerCase();
 * 
 * After (FIXED):
 *   const { appMode } = useAppMode();
 *   const mode = (appMode || "client").toLowerCase();
 * 
 * INSTALLATION:
 * Replace entire: src/pages/RootRedirect.jsx with this file
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";

import { supabase } from "@/services/supabase/supabaseClient";
import { useAppMode } from "@/app/providers/AppModeProvider";
import { useSessionProfile } from "../shared/auth/useSessionProfile";
// NOTE: keep helper close to routing guards.
// RootRedirect and RoleGate must agree on the same role → home mapping.
import { pickHomeForRole } from "../shared/routes/RoleGate";

// Single source of truth for "after login, where do we land?"
// RULES for this project:
// - Default after login is ALWAYS client home.
// - Driver flow is entered only when user explicitly switches mode (app_mode="driver").
// - Approved driver can still use client pages anytime (client mode).
export default function RootRedirect() {
  const navigate = useNavigate();
  const didRun = useRef(false);
  const { appMode, isLoading: appModeLoading } = useAppMode();

  const { session, profile, driver, driverApp, loading, refetch } = useSessionProfile({
    includeDriver: true,
    includeApplication: true,
  });

  useEffect(() => {
    if (loading || appModeLoading) return;

    // Prevent double navigation in React strict mode.
    if (didRun.current) return;
    didRun.current = true;

    const go = async () => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      const mode = String(appMode || "client").toLowerCase();

      // Default: client home
      if (mode !== "driver") {
        navigate("/client/home", { replace: true });
        return;
      }

      // Driver mode requested, but check if user has actual driver records
      let role = (profile?.role || "client").toLowerCase();

      // ⭐ YANADA SODDA & ISHONCHLI:
      // Agar user hali driver arizasini yubormagan bo'lsa (driverApp yo'q, driver yo'q),
      // app_mode="driver" ni IGNORE qilib client home ga ketamiz.
      // Bu prevent qiladi shunga: localStorage da qadim "driver" qolgan → login → pending deb xato yo'nat
      if (role !== "driver" && !driverApp && !driver) {
        // User hali driver nomzod emas, app_mode ni ignore qil
        navigate("/client/home", { replace: true });
        return;
      }

      // If user is not a driver yet, take them to registration.
      // (Approved drivers will have role="driver" already or we auto-fix below.)
      if (role !== "driver") {
        // If driver records exist, try best-effort to promote role to "driver"
        // so RoleGate won't bounce them back to client.
        if (driverApp || driver) {
          try {
            const uid = session.user.id;

            // Try both profiles.id and profiles.user_id schema patterns.
            let upd = await supabase.from("profiles").update({ role: "driver" }).eq("id", uid);
            if (upd.error && /column\s+\"id\"\s+does\s+not\s+exist/i.test(upd.error.message || "")) {
              upd = await supabase.from("profiles").update({ role: "driver" }).eq("user_id", uid);
            }

            await refetch();
            role = "driver";
          } catch (e) {
            console.warn("RootRedirect: failed to auto-set role=driver", e);
          }
        } else {
          navigate("/driver/register", { replace: true });
          return;
        }
      }

      const home = pickHomeForRole({
        role,
        driverRow: driver,
        driverApplication: driverApp,
        appMode,
      });

      navigate(home, { replace: true });
    };

    go();
  }, [loading, appModeLoading, appMode, session, profile, driver, driverApp, navigate, refetch]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <Spin size="large" tip="Yuklanmoqda..." />
    </div>
  );
}
