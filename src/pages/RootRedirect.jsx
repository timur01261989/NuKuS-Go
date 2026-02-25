import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";

import { supabase } from "@/lib/supabase";
import { useSessionProfile } from "@shared/auth/useSessionProfile";
import { pickHomeForRole } from "@shared/routes/RoleGate";

/**
 * RootRedirect ("/")
 * One job: after app loads, send user to the correct home.
 *
 * Rules:
 * - Not logged in -> /login
 * - If driver_application exists -> driver flow (pending/approved/rejected)
 * - Otherwise -> client/admin home based on profile role
 */
export default function RootRedirect() {
  const navigate = useNavigate();
  const didRun = useRef(false);

  const { loading, session, profile, role, isAdmin, driverRow, application, refetch } = useSessionProfile({
    includeDriver: true,
    includeApplication: true,
  });

  useEffect(() => {
    if (loading) return;

    // Prevent double navigation in React strict mode
    if (didRun.current) return;
    didRun.current = true;

    const go = async () => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      // Determine role
      let nextRole = (role || profile?.role || "client").toLowerCase();
      if (isAdmin) nextRole = "admin";

      // If driver application exists, enforce driver flow and best-effort fix profile.role=driver
      if (application && nextRole !== "driver" && nextRole !== "admin") {
        try {
          const uid = session.user.id;

          // Try both schemas: profiles.id or profiles.user_id
          let upd = await supabase.from("profiles").update({ role: "driver" }).eq("id", uid);

          if (upd.error && /column\s+\"id\"\s+does\s+not\s+exist/i.test(upd.error.message || "")) {
            upd = await supabase.from("profiles").update({ role: "driver" }).eq("user_id", uid);
          }

          // Refresh cached profile so RoleGate won't bounce
          await refetch?.();
          nextRole = "driver";
        } catch (e) {
          console.warn("RootRedirect: failed to auto-set role=driver", e);
        }
      }

      const home = pickHomeForRole({
        role: nextRole,
        driverRow,
        driverApplication: application,
      });

      navigate(home, { replace: true });
    };

    go();
  }, [loading, session, profile, role, isAdmin, driverRow, application, navigate, refetch]);

  return (
    <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" />
    </div>
  );
}
