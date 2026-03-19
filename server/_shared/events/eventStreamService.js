export async function publishEvent({
  supabase,
  streamType,
  entityId = null,
  payload = {},
}) {
  if (!supabase || !streamType) return null;

  const { data, error } = await supabase
    .from("event_stream")
    .insert({
      stream_type: streamType,
      entity_id: entityId,
      payload,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function readEvents({
  supabase,
  streamType,
  limit = 100,
}) {
  if (!supabase || !streamType) return [];

  const { data, error } = await supabase
    .from("event_stream")
    .select("*")
    .eq("stream_type", streamType)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}
