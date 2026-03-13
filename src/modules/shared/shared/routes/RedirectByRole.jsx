import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import Loader from "../../components/Loader.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { pickHomeForRole } from "./RoleGate.jsx";

export default function RedirectByRole() {
  const auth = useAuth();

  const target = useMemo(() => {
    if (!auth?.authReady || auth?.loading) {
      return null;
    }

    if (!auth?.isAuthed || !auth?.user) {
      return "/login";
    }

    return pickHomeForRole(auth);
  }, [auth]);

  if (!auth?.authReady || auth?.loading || !target) {
    return <Loader />;
  }

  return <Navigate replace to={target} />;
}
