import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useSessionProfile } from "@shared/auth/useSessionProfile";

/**
 * ProtectedRoute (generic)
 * Bu komponent eski useAuth(AuthProvider)ga bog'liq bo'lmasin.
 * Aks holda supabase client mismatch bo'lib redirect loop beradi.
 */
export default function ProtectedRoute({ children }) {
  const loc = useLocation();
  const { loading, session } = useSessionProfile({ includeDriver: false, includeApplication: false });

  if (loading) {
    return (
      <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
        <Spin />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return children;
}
