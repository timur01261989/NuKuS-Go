import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { useAppMode } from "@/providers/AppModeProvider";
import { useSessionProfile } from "@/shared/auth/useSessionProfile";
import { pickHomeForRole } from "@/shared/routes/RoleGate";

export default function RootRedirect() {
  const navigate = useNavigate();
  const didNavigateRef = useRef(false);
  const { appMode, isLoading: appModeLoading } = useAppMode();
  const {
    loading,
    authReady,
    session,
    role,
    driver,
    driverApp,
  } = useSessionProfile({ includeDriver: true, includeApplication: true });

  useEffect(() => {
    if (didNavigateRef.current) return;
    if (appModeLoading || loading || !authReady) return;

    if (!session?.user) {
      didNavigateRef.current = true;
      navigate("/login", { replace: true });
      return;
    }

    const target = pickHomeForRole({
      role,
      driverRow: driver,
      driverApplication: driverApp,
      appMode,
    });

    didNavigateRef.current = true;
    navigate(target, { replace: true });
  }, [appMode, appModeLoading, authReady, driver, driverApp, loading, navigate, role, session]);

  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" tip="Yuklanmoqda..." />
    </div>
  );
}
