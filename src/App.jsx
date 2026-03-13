import React, { useMemo } from "react";
import AppRouter from "./app/router/AppRouter.jsx";
import Loader from "./modules/shared/components/Loader.jsx";
import { useAuth } from "./modules/shared/auth/AuthProvider.jsx";

function AppComponent() {
  const auth = useAuth();

  const appState = useMemo(() => {
    if (!auth?.authReady || auth?.loading) {
      return {
        status: "loading",
        role: null,
      };
    }

    if (!auth?.isAuthed || !auth?.user) {
      return {
        status: "guest",
        role: "guest",
      };
    }

    if (auth?.isAdmin) {
      return {
        status: "ready",
        role: "admin",
      };
    }

    if (auth?.role === "driver" || auth?.driverExists) {
      return {
        status: "ready",
        role: "driver",
      };
    }

    return {
      status: "ready",
      role: "client",
    };
  }, [
    auth?.authReady,
    auth?.driverExists,
    auth?.isAdmin,
    auth?.isAuthed,
    auth?.loading,
    auth?.role,
    auth?.user,
  ]);

  if (appState.status === "loading") {
    return <Loader />;
  }

  return <AppRouter appRole={appState.role} />;
}

export default React.memo(AppComponent);
