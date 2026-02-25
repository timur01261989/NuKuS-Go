import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSessionProfile } from "@shared/auth/useSessionProfile";
import { pickHomeForRole } from "./RoleGate";

/**
 * RedirectByRole
 * Legacy root redirect helper.
 *
 * IMPORTANT: it must not create its own truth table.
 * It defers to pickHomeForRole (same logic used by RootRedirect/RoleGate),
 * which also respects persisted app_mode ("client" vs "driver").
 */
export default function RedirectByRole() {
  const [target, setTarget] = useState(null);

  const { loading, session, profile, driverRow, application } = useSessionProfile({
    includeDriver: true,
    includeApplication: true,
  });

  useEffect(() => {
    if (loading) return;

    if (!session) {
      setTarget("/login");
      return;
    }

    const role = profile?.role || "client";

    const home = pickHomeForRole({
      role,
      driverRow,
      driverApplication: application,
    });

    setTarget(home);
  }, [loading, session, profile, driverRow, application]);

  if (loading || !target) return null;
  return <Navigate to={target} replace />;
}
