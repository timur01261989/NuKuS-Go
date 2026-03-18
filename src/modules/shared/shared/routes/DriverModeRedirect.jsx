import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAppMode } from "@/app/providers/AppModeProvider";
import { ROUTES } from "@/app/router/routePaths.js";

export default function DriverModeRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAppMode } = useAppMode();

  React.useEffect(() => {
    setAppMode("driver");

    const fromPath = location.state?.from;

    navigate(ROUTES.driver.home, {
      replace: true,
      state: { from: fromPath },
    });
  }, [navigate, location, setAppMode]);

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
