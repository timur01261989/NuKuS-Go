import { withAuth } from "../_shared/withAuth.js";
import { getServiceSupabase } from "../_shared/supabase.js";

async function handler(req, res) {
  const supabase = getServiceSupabase();

  if (req.method === "GET") {
    const limit = Math.min(Number(req.query?.limit || 100), 500);

    const { data, error } = await supabase
      .from("observability_metrics")
      .select("*")
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
