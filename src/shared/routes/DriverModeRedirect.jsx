import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Spin } from "antd";

import { useSessionProfile } from "@shared/auth/useSessionProfile";
import { pickHomeForRole } from "@shared/routes/RoleGate";

/**
 * DriverModeRedirect
 * /driver-mode route:
 * - agar login bo'lmagan bo'lsa -> /login
 * - agar driver flow bo'lsa -> pending/dashboard (pickHomeForRole)
 * - agar driver flow bo'lmasa -> /driver/register
 *
 * Maqsad: ClientHome ichidagi "Driver mode" tugmasi bosilganda to'g'ri joyga olib borish.
 */
export default function DriverModeRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, session, role, isAdmin, driverRow, application } = useSessionProfile({
    includeDriver: true,
    includeApplication: true,
  });

  React.useEffect(() => {
    if (loading) return;

    const fromPath = location.state?.from;

    if (!session) {
      navigate("/login", { replace: true, state: { from: fromPath } });
      return;
    }

    // Admin bo'lsa ham driver-mode bosishi mumkin — adminni admin panelga qaytaramiz
    let r = (role || "client").toLowerCase();
    if (isAdmin) r = "admin";

    // Agar driver application yoki drivers row yo'q bo'lsa, ro'yxatdan o'tishga yuboramiz
    if (!application && !driverRow && r !== "driver") {
      navigate("/driver/register", { replace: true, state: { from: fromPath } });
      return;
    }

    const target = pickHomeForRole({
      role: r === "client" && application ? "driver" : r,
      driverRow,
      driverApplication: application,
    });

    navigate(target, { replace: true, state: { from: fromPath } });
  }, [loading, session, role, isAdmin, driverRow, application, navigate, location.state]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" />
    </div>
  );
}
