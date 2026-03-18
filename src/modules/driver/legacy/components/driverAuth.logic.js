import { supabase } from "@/services/supabase/supabaseClient";
import { normalizeDriverStatus } from "./driverAuth.helpers.jsx";

export async function resolveLegacyDriverStatus() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const sessionUser = sessionData?.session?.user;
  if (!sessionUser?.id) {
    return { status: "need_login", user: null, application: null };
  }

  const [applicationsQuery, profileQuery] = await Promise.all([
    supabase
      .from("driver_applications")
      .select("id,user_id,status,is_verified")
      .eq("user_id", sessionUser.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("profiles")
      .select("driver_status, role")
      .eq("id", sessionUser.id)
      .maybeSingle(),
  ]);

  if (applicationsQuery.error) throw applicationsQuery.error;
  if (profileQuery.error) throw profileQuery.error;

  const application = applicationsQuery.data?.[0] || null;
  const profile = profileQuery.data || null;

  if (!application && !profile?.driver_status) {
    return { status: "none", user: sessionUser, application: null, profile };
  }

  const rawStatus = application?.status || profile?.driver_status;
  const normalized = normalizeDriverStatus(rawStatus);

  if (normalized === "active" && application?.is_verified === false) {
    return { status: "pending", user: sessionUser, application, profile };
  }

  return { status: normalized, user: sessionUser, application, profile };
}
