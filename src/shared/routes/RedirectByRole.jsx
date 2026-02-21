import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";

/**
 * RedirectByRole
 * Purpose: Decide the safest default landing route after auth.
 *
 * IMPORTANT:
 * - Default to CLIENT to avoid "everybody becomes driver" UX.
 * - Admin/dispatch still go to their dashboards.
 * - Driver users can always open /driver/dashboard manually or via the app's "Driver mode" entrypoint.
 */
export default function RedirectByRole() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user) {
          if (!cancelled) navigate("/login", { replace: true });
          return;
        }

        // Fetch profile role (if RLS blocks it, we still fall back to client)
        let role = "client";
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!profileErr && profile?.role) {
          role = profile.role;
        }

        // Route decision
        if (!cancelled) {
          if (role === "admin") return navigate("/admin/dashboard", { replace: true });
          if (role === "dispatch") return navigate("/dispatch/dashboard", { replace: true });

          // Default
          return navigate("/client/home", { replace: true });
        }
      } catch (e) {
        // Safe fallback
        if (!cancelled) navigate("/client/home", { replace: true });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return null;
}
