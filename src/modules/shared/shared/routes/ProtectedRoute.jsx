import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { authReady, isAuthed } = useAuth();
  const loc = useLocation();

  if (!authReady) return <div style={{ padding: 24 }}>Loading...</div>;

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return children;
}
