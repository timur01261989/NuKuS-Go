/**
 * DriverModeRedirect.jsx - FIXED VERSION
 * 
 * Changes:
 * ✅ Use useAppMode() context instead of localStorage
 * ✅ Removed hardcoded localStorage.setItem("app_mode", "driver")
 * 
 * INSTALLATION:
 * Replace: src/shared/routes/DriverModeRedirect.jsx
 */

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAppMode } from "@/app/providers/AppModeProvider"; // ✅ ADD THIS

/**
 * DriverModeRedirect
 * /driver-mode route: user explicitly switches to driver mode
 */
export default function DriverModeRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAppMode } = useAppMode(); // ✅ GET FROM CONTEXT

  React.useEffect(() => {
    // ✅ FIXED: Use context instead of localStorage
    setAppMode("driver");

    const fromPath = location.state?.from;

    // Go to protected driver dashboard:
    // - if approved => dashboard
    // - if not approved => RoleGate will redirect to /driver/pending
    // - if not a driver => RoleGate will redirect to /driver/register
    navigate("/driver/dashboard", {
      replace: true,
      state: { from: fromPath },
    });
  }, [navigate, location, setAppMode]); // ✅ ADD setAppMode TO DEPS

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
