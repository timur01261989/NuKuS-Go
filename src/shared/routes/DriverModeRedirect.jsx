import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Spin } from "antd";

/**
 * DriverModeRedirect
 * /driver-mode route: user explicitly switches to driver mode
 */
export default function DriverModeRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // user explicitly wants driver mode
    try {
      localStorage.setItem("app_mode", "driver");
    } catch (e) {
      // ignore storage errors
    }

    const fromPath = location.state?.from;

    // Go to protected driver dashboard:
    // - if approved => dashboard
    // - if not approved => RoleGate will redirect to /driver/pending
    // - if not a driver => RoleGate will redirect to /driver/register
    navigate("/driver/dashboard", {
      replace: true,
      state: { from: fromPath },
    });
  }, [navigate, location]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spin size="large" tip="Yuklanmoqda..." />
    </div>
  );
}
