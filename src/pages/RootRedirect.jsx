import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { useAppMode } from "@/providers/AppModeProvider";
import { useSessionProfile } from "@/shared/auth/useSessionProfile";
import { pickHomeForRole } from "@/shared/routes/RoleGate";
import { usePageI18n } from "./pageI18n";

export default function RootRedirect() {
  const navigate = useNavigate();
  const { tx } = usePageI18n();
  const { appMode, isLoading: appModeLoading } = useAppMode();
  const { loading, session, profile, driver, driverApp } = useSessionProfile({ includeDriver: true, includeApplication: true });

  useEffect(() => {
    if (loading || appModeLoading) return;
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    const home = pickHomeForRole({
      role: profile?.role,
      driverRow: driver,
      driverApplication: driverApp,
      appMode,
    });
    navigate(home, { replace: true });
  }, [appMode, appModeLoading, driver, driverApp, loading, navigate, profile, session]);

  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" tip={tx("loading", "Yuklanmoqda...")} />
    </div>
  );
}
