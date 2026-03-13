import React, { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Loader from "../../components/Loader.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";

export function pickHomeForRole({ role, driverExists, driverApproved, applicationStatus }) {
  const normalizedRole = String(role || "client").trim().toLowerCase();
  const normalizedStatus = typeof applicationStatus === "string" ? applicationStatus.trim().toLowerCase() : "";

  if (normalizedRole === "admin") return "/admin";
  if (normalizedRole !== "driver") return "/client/home";
  if (!driverExists && normalizedStatus === "pending") return "/driver/pending";
  if (!driverExists) return "/driver/register";
  if (!driverApproved) return "/driver/pending";
  return "/driver/dashboard";
}

export default function RoleGate({ children, allow, redirectTo = "/login" }) {
  const location = useLocation();
  const auth = useAuth();

  const decision = useMemo(() => {
    const allowConfig = allow || {};
    const isLoading = !auth?.authReady || auth?.loading;

    if (isLoading) {
      return { mode: "loading", target: null };
    }

    if (!auth?.isAuthed || !auth?.user) {
      return {
        mode: "redirect",
        target: redirectTo,
        state: { from: `${location.pathname}${location.search}${location.hash}` },
      };
    }

    const role = String(auth?.role || "client").trim().toLowerCase();
    const allowClient = !!allowConfig.client;
    const allowDriver = !!allowConfig.driver;
    const requireDriverApproved = !!allowConfig.requireDriverApproved;

    if (role === "admin") {
      return { mode: "allow" };
    }

    if (role === "driver") {
      if (!allowDriver) {
        return { mode: "redirect", target: pickHomeForRole(auth) };
      }
      if (requireDriverApproved && !auth?.driverApproved) {
        return { mode: "redirect", target: pickHomeForRole(auth) };
      }
      return { mode: "allow" };
    }

    if (!allowClient) {
      return { mode: "redirect", target: pickHomeForRole(auth) };
    }

    return { mode: "allow" };
  }, [allow, auth, location.hash, location.pathname, location.search, redirectTo]);

  if (decision.mode === "loading") {
    return <Loader />;
  }

  if (decision.mode === "redirect") {
    return <Navigate replace to={decision.target} state={decision.state} />;
  }

  return children;
}
