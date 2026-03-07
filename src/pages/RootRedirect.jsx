/**
 * RootRedirect.jsx - FINAL FIXED VERSION
 * Location: src/pages/RootRedirect.jsx
 * 
 * FIX: Import and use useAppMode hook correctly
 */

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { useAppMode } from "@/providers/AppModeProvider"; // ✅ CRITICAL IMPORT

export default function RootRedirect() {
  const navigate = useNavigate();
  const { appMode } = useAppMode(); // ✅ GET appMode FROM CONTEXT

  useEffect(() => {
    if (!appMode) return; // Wait until appMode is loaded

    const mode = (appMode || "client").toLowerCase();

    if (mode === "driver") {
      navigate("/driver/dashboard", { replace: true });
    } else {
      navigate("/client/home", { replace: true });
    }
  }, [navigate, appMode]); // ✅ appMode IN DEPENDENCIES

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" tip="Yuklanmoqda..." />
    </div>
  );
}
