import { withAuth } from "../_shared/withAuth.js";
import { getServiceSupabase } from "../_shared/supabase.js";
import { OBSERVABILITY_METRIC_COLUMNS } from "../_shared/supabaseColumns.js";

export function isObservabilityAdminProfile(profile) {
  const role = String(profile?.role || profile?.app_role || "").trim().toLowerCase();
  return role === "admin" || profile?.is_admin === true;
}

async function requireObservabilityAdmin(supabase, userId) {
  if (!userId) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role, app_role, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, error: error.message || "profile_lookup_failed" };
  }

  if (!isObservabilityAdminProfile(data)) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  return { ok: true, profile: data };
}

async function handler(req, res) {
  const supabase = req.supabaseAdmin || getServiceSupabase();
  const access = await requireObservabilityAdmin(supabase, req.authUserId || req.authUser?.id || null);
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }

  if (req.method === "GET") {
    const limit = Math.min(Math.max(Number(req.query?.limit || 100), 1), 500);

    const { data, error } = await supabase
      .from("observability_metrics")
      .select(OBSERVABILITY_METRIC_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ rows: data || [] });
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}

export default withAuth(handler);
