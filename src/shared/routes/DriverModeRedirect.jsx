import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Spin } from "antd";

/**
 * DriverModeRedirect
 * This route is an INTENT switch:
 * - persist app_mode="driver"
 * - then send user to "/" so RootRedirect can decide:
 *   - approved -> /driver/dashboard
 *   - not approved -> /driver/pending (or /driver/register)
 *   - not logged in -> /login
 */
export default function DriverModeRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const fromPath = location.state?.from;

    try {
      if (typeof window !== "undefined") {
        window.localStorage?.setItem("app_mode", "driver");
      }
    } catch {}

    navigate("/", {
      replace: true,
      state: { from: fromPath },
    });
  }, [navigate, location.state]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spin size="large" />
    </div>
  );
}
