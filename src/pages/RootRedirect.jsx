import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";

import { supabase } from "../services/supabaseClient";
import { useSessionProfile } from "../shared/auth/useSessionProfile";
// NOTE: keep helper close to routing guards.
// RootRedirect and RoleGate must agree on the same role → home mapping.
import { pickHomeForRole } from "../shared/routes/RoleGate";

// Single source of truth for "after login, where do we land?"
// Key requirement for this project:
// - If a user has a driver_application, we treat them as a driver flow (pending/approved) even if profiles.role was never set.
// - We ALSO try to auto-fix profiles.role='driver' so protected /driver routes won't bounce them to client.
export default function RootRedirect() {
  const navigate = useNavigate();
  const didRun = useRef(false);

  const { session, profile, driverRow: driver, application: driverApp, loading, refetch } = useSessionProfile({
    includeDriver: true,
    includeApplication: true,
  });

  useEffect(() => {
    if (loading) return;

    // Prevent double navigation in React strict mode.
    if (didRun.current) return;
    didRun.current = true;

    const go = async () => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      const role = profile?.role || "client";

      // Resolve persisted mode (driver can intentionally use client screens).
      const storedMode =
        typeof window !== "undefined"
          ? window.localStorage?.getItem("app_mode")
          : null;

      // If mode is not set yet, choose a sane default.
      // - If they have any driver intent (application or driver row), default to driver mode.
      // - Otherwise default to client mode.
      if (typeof window !== "undefined") {
        if (storedMode !== "client" && storedMode !== "driver") {
          const hasDriverIntent = !!driverApp || !!driver || role === "driver";
          window.localStorage?.setItem("app_mode", hasDriverIntent ? "driver" : "client");
        }
      }

      // If driver application exists, best-effort ensure profile.role='driver' so other guards don't misread.
      if (driverApp && role !== "driver") {
        try {
          const uid = session.user.id;

          let upd = await supabase.from("profiles").update({ role: "driver" }).eq("id", uid);
          if (upd.error && /column\s+\"id\"\s+does\s+not\s+exist/i.test(upd.error.message || "")) {
            upd = await supabase.from("profiles").update({ role: "driver" }).eq("user_id", uid);
          }

          await refetch();
        } catch (e) {
          console.warn("RootRedirect: failed to auto-set role=driver", e);
        }
      }

      const home = pickHomeForRole({
        role,
        driverRow: driver,
        driverApplication: driverApp,
      });

      navigate(home, { replace: true });
    };

    go();
  }, [loading, session, profile, driver, driverApp, navigate, refetch]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <Spin size="large" tip="Yuklanmoqda..." />
    </div>
  );
}
