import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import supabase from "../../config/supabaseClient";

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

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("RedirectByRole: sessionError", sessionError);
        }

        const user = session?.user;
        if (!user) {
          if (isMounted) setTarget("/login");
          return;
        }

        // 1) read profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role,is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("RedirectByRole: profileError", profileError);
        }

        // admin always wins
        if (profile?.is_admin) {
          if (isMounted) setTarget("/admin");
          return;
        }

        const role = profile?.role || "client";

        // 2) driver route decision
        if (role === "driver") {
          const { data: appRow, error: appError } = await supabase
            .from("driver_applications")
            .select("status")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (appError) {
            console.error("RedirectByRole: driver app error", appError);
          }

          const status = appRow?.status || null;

          if (!status) {
            if (isMounted) setTarget("/driver/register");
            return;
          }

          if (status === "approved") {
            if (isMounted) setTarget("/driver/dashboard");
            return;
          }

          // pending / rejected / other
          if (isMounted) setTarget("/driver/pending");
          return;
        }

        // 3) client default
        if (isMounted) setTarget("/client/home");
      } catch (e) {
        console.error("RedirectByRole: unexpected error", e);
        if (isMounted) setTarget("/client/home");
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!target) return null;
  return <Navigate to={target} replace />;
}
