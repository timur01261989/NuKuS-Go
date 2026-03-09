import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { useAppMode } from "@/providers/AppModeProvider";
import { useSessionProfile } from "@/shared/auth/useSessionProfile";
import { usePageI18n } from "./pageI18n";

function resolveHome({ appMode, session, profile, driverRow, driverApp }) {
  if (!session?.user?.id) return "/login";

  const appStatus = String(driverApp?.status || "").toLowerCase();
  const approved = !!(
    driverRow &&
    (driverRow.is_verified === true || driverRow.approved === true)
  );

  if (appMode === "driver") {
    if (approved) return "/app/driver/dashboard";
    if (appStatus === "pending") return "/app/driver/pending";
    return "/app/driver/register";
  }

  if (profile?.role === "admin" || profile?.current_role === "admin") {
    return "/app/admin";
  }

  return "/app/client/home";
}

export default function RootRedirect() {
  const navigate = useNavigate();
  const { tx } = usePageI18n();
  const { appMode, isLoading: appModeLoading } = useAppMode();
  const { loading, session, profile, driver, driverApp } = useSessionProfile({
    includeDriver: true,
    includeApplication: true,
  });

  useEffect(() => {
    if (loading || appModeLoading) return;

    const home = resolveHome({
      appMode,
      session,
      profile,
      driverRow: driver,
      driverApp,
    });

    navigate(home, { replace: true });
  }, [appMode, appModeLoading, driver, driverApp, loading, navigate, profile, session]);

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spin size="large" tip={tx("loading", "Yuklanmoqda...")} />
    </div>
  );
}
