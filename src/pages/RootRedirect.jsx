import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";

import { supabase } from "../services/supabaseClient";
import { useSessionProfile } from "../shared/auth/useSessionProfile";
import { pickHomeForRole } from "../shared/routes/roleRouting";

// Single source of truth for "after login, where do we land?"
// Key requirement for this project:
// - If a user has a driver_application, we treat them as a driver flow (pending/approved) even if profiles.role was never set.
// - We ALSO try to auto-fix profiles.role='driver' so protected /driver routes won't bounce them to client.
export default function RootRedirect() {
  const navigate = useNavigate();
  const didRun = useRef(false);

  const { session, profile, driver, driverApp, loading, refetch } = useSessionProfile({
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

      // If driver application exists, force driver flow.
      if (driverApp) {
        // Attempt to fix role once (best-effort). If RLS blocks it, we still route using driverApp.
        if (role !== "driver") {
          try {
            // Try both profiles.id and profiles.user_id schema patterns.
            const uid = session.user.id;
            let upd = await supabase.from("profiles").update({ role: "driver" }).eq("id", uid);
            if (upd.error && /column\s+\"id\"\s+does\s+not\s+exist/i.test(upd.error.message || "")) {
              upd = await supabase.from("profiles").update({ role: "driver" }).eq("user_id", uid);
            }

            // Refresh cached profile so RoleGate won't bounce.
            await refetch();
          } catch (e) {
            console.warn("RootRedirect: failed to auto-set role=driver", e);
          }
        }

        const status = (driverApp.status || "pending").toLowerCase();
        const hasDriverRow = !!driver;

        if (status === "approved" && hasDriverRow) {
          navigate("/driver/home", { replace: true });
          return;
        }

        // pending / approved-without-driver-row / rejected → pending screen
        navigate("/driver/pending", { replace: true });
        return;
      }

      // No driver application: normal role routing
      navigate(pickHomeForRole(role), { replace: true });
    };

    go();
  }, [loading, session, profile, driver, driverApp, navigate, refetch]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <Spin size="large" tip="Yuklanmoqda..." />
    </div>
  );
}
