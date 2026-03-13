import { withAuth } from "../_shared/withAuth.js";
import { getServiceSupabase } from "../_shared/supabase.js";
import { readEvents } from "../_shared/events/eventStreamService.js";

async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const supabase = getServiceSupabase();
  const streamType = req.query?.stream_type || "dispatch";
  const limit = Math.min(Number(req.query?.limit || 100), 500);

  const rows = await readEvents({
    supabase,
    streamType,
    limit,
  });

  res.status(200).json({ rows });
}

export default withAuth(handler);
