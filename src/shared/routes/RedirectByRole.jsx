import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSessionProfile } from "@shared/auth/useSessionProfile";

/**
 * Root redirect:
 * - admin -> /admin
 * - driver -> /driver/dashboard  (or /driver/pending, /driver/register depending on application status)
 * - client (default) -> /client/home
 *
 * NOTE: This component is used only for "/" (root). It should not force users out of pages they intentionally visit.
 */
export default function RedirectByRole() {
  const [target, setTarget] = useState(null);

  // Single loader (no redirects while loading)
  const { loading, user, role, isAdmin, driverExists, driverApproved, applicationStatus } = useSessionProfile({
    includeDriver: true,
    includeApplication: true,
  });

  useEffect(() => {
    let isMounted = true;

    const decide = async () => {
      if (!supabase) return;

      // Not logged in -> login
      if (!user) {
        if (isMounted) setTarget("/login");
        return;
      }

      // Admin always wins
      if (isAdmin) {
        if (isMounted) setTarget("/admin");
        return;
      }

      if (role === "driver") {
        // Variant A: driver access is controlled by drivers table
        if (!driverExists) {
          // If they have a pending application, keep them on pending
          if (applicationStatus === "pending") {
            if (isMounted) setTarget("/driver/pending");
            return;
          }
          if (isMounted) setTarget("/driver/register");
          return;
        }

        if (!driverApproved) {
          if (isMounted) setTarget("/driver/pending");
          return;
        }

        if (isMounted) setTarget("/driver/dashboard");
        return;
      }

      // Default client
      if (isMounted) setTarget("/client/home");
    };

    // Only decide after loading is finished (prevents redirect storms)
    if (!loading) decide();

    return () => {
      isMounted = false;
    };
  }, [loading, user, role, isAdmin, driverExists, driverApproved, applicationStatus]);

  if (loading || !target) return null;
  return <Navigate to={target} replace />;
}
