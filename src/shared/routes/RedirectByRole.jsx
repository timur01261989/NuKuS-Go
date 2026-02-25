import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";

import { useSessionProfile } from "@shared/auth/useSessionProfile";
import { pickHomeForRole } from "@shared/routes/RoleGate";

/**
 * RedirectByRole
 * Kechki legacy komponent: hozir asosan "/" uchun ishlatilgan.
 * RootRedirect bilan bir xil qoidaga bo'ysunadi (single source of truth).
 */
export default function RedirectByRole() {
  const { loading, session, role, isAdmin, driverRow, application } = useSessionProfile({
    includeDriver: true,
    includeApplication: true,
  });

  const target = useMemo(() => {
    if (!session) return "/login";

    let r = (role || "client").toLowerCase();
    if (isAdmin) r = "admin";

    return pickHomeForRole({ role: r, driverRow, driverApplication: application });
  }, [session, role, isAdmin, driverRow, application]);

  if (loading) {
    return (
      <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return <Navigate to={target} replace />;
}
