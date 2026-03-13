export async function checkRateLimit({
  supabase,
  actorKey,
  routeKey,
  limit = 60,
}) {
  if (!supabase || !actorKey || !routeKey) {
    return { allowed: true, remaining: limit };
  }

  const { data: row, error } = await supabase
    .from("api_rate_limits")
    .select("*")
    .eq("actor_key", actorKey)
    .eq("route_key", routeKey)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!row) {
    await supabase.from("api_rate_limits").insert({
      actor_key: actorKey,
      route_key: routeKey,
      request_count: 1,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  const nextCount = Number(row.request_count || 0) + 1;
  const allowed = nextCount <= limit;

  await supabase
    .from("api_rate_limits")
    .update({
      request_count: nextCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  return {
    allowed,
    remaining: Math.max(0, limit - nextCount),
  };
}
