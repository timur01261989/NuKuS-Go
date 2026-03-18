import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import Loader from "../../components/Loader.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { pickHomeForAuth, selectAccessState } from "../../auth/accessState.js";

export default function RedirectByRole() {
  const auth = useAuth();

  const redirectState = useMemo(() => {
    const access = selectAccessState(auth);

    if (access.mode === "loading") {
      return { loading: true, target: null };
    }

    return {
      loading: false,
      target: pickHomeForAuth(auth),
    };
  }, [auth]);

  if (redirectState.loading || !redirectState.target) {
    return <Loader />;
  }

  return <Navigate replace to={redirectState.target} />;
}
