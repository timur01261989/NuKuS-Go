export async function recordMetric({ supabase, metric, value, meta = null }) {
  if (!supabase) throw new Error('supabase_required');
  if (!metric) throw new Error('metric_required');

  const payload = {
    metric: String(metric),
    value: value == null ? null : Number(value),
    meta,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('platform_metrics').insert(payload);
  if (error) throw error;
  return payload;
}
