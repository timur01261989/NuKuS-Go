import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { useAppMode } from "@/app/providers/AppModeProvider";
import { useAuth } from "@/modules/shared/auth/AuthProvider.jsx";
import { pickHomeForAuth, selectAccessState } from "@/modules/shared/auth/accessState.js";

export default function RootRedirect() {
  const navigate = useNavigate();
  const didRun = useRef(false);
  const { appMode, isLoading: appModeLoading } = useAppMode();
  const auth = useAuth();

  useEffect(() => {
    const access = selectAccessState(auth);

    if (access.mode === "loading" || appModeLoading) return;
    if (didRun.current) return;
    didRun.current = true;

    const target = pickHomeForAuth(auth, appMode);
    navigate(target, { replace: true });
  }, [appMode, appModeLoading, auth, navigate]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <Spin size="large" tip="Yuklanmoqda..." />
    </div>
  );
}
