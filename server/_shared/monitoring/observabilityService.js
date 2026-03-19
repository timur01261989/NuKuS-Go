export function buildMetric(metricName, metricValue, labels = {}) {
  return {
    metric_name: metricName,
    metric_value: Number(metricValue || 0),
    labels,
  };
}

export async function recordMetric({ supabase, metricName, metricValue, labels = {} }) {
  if (!supabase) return null;

  const payload = buildMetric(metricName, metricValue, labels);

  const { data, error } = await supabase
    .from("observability_metrics")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
