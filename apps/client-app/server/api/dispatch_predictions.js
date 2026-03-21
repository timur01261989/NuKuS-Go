import { withAuth } from "../_shared/withAuth.js";
import { getServiceSupabase } from "../_shared/supabase.js";

async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const supabase = getServiceSupabase();
  const limit = Math.min(Number(req.query?.limit || 50), 200);

  const { data, error } = await supabase
    .from("dispatch_demand_predictions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ rows: data || [] });
}

export default withAuth(handler);
