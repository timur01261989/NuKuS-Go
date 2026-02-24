import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../auth/AuthProvider";

export default function RoleGate({ allowedRoles, children }) {
  const { authReady, user, isAuthed } = useAuth();
  const [role, setRole] = useState(null);
  const [roleReady, setRoleReady] = useState(false);
  const loc = useLocation();

  const lastUserIdRef = useRef(null);

  useEffect(() => {
    let alive = true;

    async function loadRole() {
      if (!authReady) return;
      if (!isAuthed || !user?.id) {
        setRole(null);
        setRoleReady(true);
        return;
      }

      if (lastUserIdRef.current === user.id && roleReady) return;
      lastUserIdRef.current = user.id;

      setRoleReady(false);

      const { data: prof, error } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        console.error("profiles select error:", error);
        setRole(null);
        setRoleReady(true);
        return;
      }

      if (!prof) {
        const { error: upErr } = await supabase.from("profiles").upsert(
          { id: user.id, role: "client" },
          { onConflict: "id" }
        );

        if (!alive) return;

        if (upErr) {
          console.error("profiles upsert error:", upErr);
          setRole(null);
          setRoleReady(true);
          return;
        }

        setRole("client");
        setRoleReady(true);
        return;
      }

      setRole(prof.role ?? "client");
      setRoleReady(true);
    }

    loadRole();

    return () => {
      alive = false;
    };
  }, [authReady, isAuthed, user?.id]);

  if (!authReady) return <div style={{ padding: 24 }}>Loading...</div>;

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (!roleReady) return <div style={{ padding: 24 }}>Loading...</div>;

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to="/client/home" replace />;
  }

  return children;
}
