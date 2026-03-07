/**
 * DriverPending.jsx - FINAL FIXED VERSION
 * Location: src/pages/DriverPending.jsx
 * 
 * FIX: Import and use setAppMode hook correctly
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppMode } from "@/providers/AppModeProvider"; // ✅ CRITICAL IMPORT
import { useUserStore } from "@/hooks/useUserStore";
import { Button, Card, Result, Spin } from "antd";

export default function DriverPending() {
  const navigate = useNavigate();
  const { setAppMode } = useAppMode(); // ✅ GET setAppMode FROM CONTEXT
  const { user, driverApplication, loading } = useUserStore();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const role = (user.role || "").toLowerCase();
    if (role !== "driver") {
      navigate("/client/home", { replace: true });
      return;
    }

    const appStatus = driverApplication?.status || "unknown";
    if (appStatus === "approved") {
      navigate("/driver/dashboard", { replace: true });
    } else {
      setStatus(appStatus);
    }
  }, [user, driverApplication, loading, navigate]);

  const handleReturnToClient = () => {
    setAppMode("client"); // ✅ USE setAppMode FROM CONTEXT
    navigate("/client/home", { replace: true });
  };

  const handleRegister = () => {
    navigate("/driver/register", { replace: true });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" tip="Tekshirilmoqda..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <Card style={{ maxWidth: "500px", width: "100%" }}>
        {status === "pending" || status === "submitted" ? (
          <Result
            status="info"
            title="Ro'yxatdan O'tish Kutilmoqda"
            subTitle="Sizning haydovchi ro'yxatxonasi tekshirilmoqda. Natija haqida e'lon berdik."
            extra={[
              <Button type="primary" key="client" onClick={handleReturnToClient}>
                Yo'lovchi Rejimga Qaytish
              </Button>,
            ]}
          />
        ) : (
          <Result
            status="success"
            title="Ro'yxatdan O'tish Taqqoslandi"
            subTitle="Sizni haydovchi sifatida tasdiqlashga xush kelibsiz!"
            extra={[
              <Button type="primary" key="dashboard" onClick={() => navigate("/driver/dashboard", { replace: true })}>
                Dashboard'ga O'tish
              </Button>,
            ]}
          />
        )}
      </Card>
    </div>
  );
}
