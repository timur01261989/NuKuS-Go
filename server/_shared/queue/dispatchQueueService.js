export async function enqueueDispatchJob({
  supabase,
  orderId,
  serviceType = "taxi",
  pickupLat = null,
  pickupLng = null,
  radiusKm = 3,
  wave = 1,
}) {
  if (!supabase || !orderId) {
    throw new Error("invalid_enqueue_dispatch_context");
  }

  const { data, error } = await supabase.rpc("enqueue_dispatch_job", {
    p_order_id: orderId,
    p_service_type: serviceType,
    p_pickup_lat: pickupLat,
    p_pickup_lng: pickupLng,
    p_radius_km: radiusKm,
    p_wave: wave,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function claimQueuedDispatchJobs({ supabase, limit = 10 }) {
  if (!supabase) {
    throw new Error("invalid_claim_dispatch_context");
  }

  const { data, error } = await supabase
    .from("dispatch_queue")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

export async function markDispatchJobProcessing({ supabase, jobId }) {
  const { error } = await supabase
    .from("dispatch_queue")
    .update({
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    throw error;
  }
}

export async function markDispatchJobDone({ supabase, jobId }) {
  const { error } = await supabase
    .from("dispatch_queue")
    .update({
      status: "done",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    throw error;
  }
}

export async function incrementDispatchJobAttempts({ supabase, jobId }) {
  const { data, error } = await supabase
    .from("dispatch_queue")
    .select("attempts")
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const attempts = Number(data?.attempts || 0) + 1;

  const { error: updateError } = await supabase
    .from("dispatch_queue")
    .update({
      attempts,
      status: "queued",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (updateError) {
    throw updateError;
  }

  return attempts;
}
