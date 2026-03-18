import React, { useMemo } from "react";
import AppRouter from "./app/router/AppRouter.jsx";
import Loader from "./modules/shared/components/Loader.jsx";
import { useAuth } from "./modules/shared/auth/AuthProvider.jsx";
import { selectAccessState } from "./modules/shared/auth/accessState.js";

function AppComponent() {
  const auth = useAuth();

  const appState = useMemo(() => {
    const access = selectAccessState(auth);

    if (access.mode === "loading") {
      return { status: "loading", role: null };
    }

    return {
      status: access.mode === "guest" ? "guest" : "ready",
      role: access.appRole,
    };
  }, [auth]);

  if (appState.status === "loading") {
    return <Loader />;
  }

  return <AppRouter appRole={appState.role} />;
}

export default React.memo(AppComponent);
