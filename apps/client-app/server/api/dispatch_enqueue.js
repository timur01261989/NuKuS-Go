import { withAuth } from "../_shared/withAuth.js";
import { getServiceSupabase } from "../_shared/supabase.js";
import { enqueueDispatchJob } from "../_shared/queue/dispatchQueueService.js";

async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const supabase = getServiceSupabase();
  const {
    order_id,
    service_type,
    pickup_lat,
    pickup_lng,
    radius_km,
    wave,
  } = req.body || {};

  const id = await enqueueDispatchJob({
    supabase,
    orderId: order_id,
    serviceType: service_type || "taxi",
    pickupLat: pickup_lat ?? null,
    pickupLng: pickup_lng ?? null,
    radiusKm: radius_km ?? 3,
    wave: wave ?? 1,
  });

  res.status(200).json({ ok: true, id });
}

export default withAuth(handler);
