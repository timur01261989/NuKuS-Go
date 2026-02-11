import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@lib/supabase";

/**
 * allow:
 *  - client: true/false
 *  - driver: true/false
 *  - requireDriverApproved: true/false
 */
export default function RoleGate({ children, allow, redirectTo="/login" }) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const [reason, setReason] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: s } = await supabase.auth.getSession();
        const session = s?.session;
        if (!session) {
          if (!mounted) return;
          setOk(false);
          setReason("no-session");
          setLoading(false);
          return;
        }

        // profiles may not exist in some installs; fallback to allow.client
        let role = "client";
        let approved = true;

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, driver_approved")
            .eq("id", session.user.id)
            .single();

          if (profile?.role) role = profile.role;
          if (typeof profile?.driver_approved === "boolean") approved = profile.driver_approved;
        } catch {
          // ignore
        }

        let allowed = false;
        if (role === "client" && allow?.client) allowed = true;
        if (role === "driver" && allow?.driver) {
          if (allow?.requireDriverApproved && !approved) {
            allowed = false;
            if (!mounted) return;
            setReason("driver-not-approved");
          } else {
            allowed = true;
          }
        }

        if (!mounted) return;
        setOk(allowed);
        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setOk(false);
        setReason("error");
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [allow]);

  if (loading) return null;

  if (!ok) {
    if (reason === "driver-not-approved") return <Navigate to="/driver-pending" replace />;
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
