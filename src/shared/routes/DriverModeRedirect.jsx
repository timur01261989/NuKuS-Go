/**
 * DriverModeRedirect.jsx - FINAL FIXED VERSION
 * Location: src/shared/routes/DriverModeRedirect.jsx
 * 
 * FIX: Import and use setAppMode hook correctly
 */

import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppMode } from "@/providers/AppModeProvider"; // ✅ CRITICAL IMPORT
import { Spin } from "antd";

export default function DriverModeRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAppMode } = useAppMode(); // ✅ GET setAppMode FROM CONTEXT

  useEffect(() => {
    setAppMode("driver"); // ✅ USE setAppMode FROM CONTEXT

    const fromPath = location.state?.from;
    navigate("/driver/dashboard", {
      replace: true,
      state: { from: fromPath },
    });
  }, [navigate, setAppMode, location]); // ✅ setAppMode IN DEPENDENCIES

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" tip="Yuklanmoqda..." />
    </div>
  );
}
