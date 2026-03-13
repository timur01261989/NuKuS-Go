import { calculateRecommendedWorkers } from "../_shared/queue/workerAutoscalingService.js";

export async function runAutoscalingWorker({ supabase }) {
  const { data: rows } = await supabase
    .from("worker_autoscaling_state")
    .select("*")
    .limit(100);

  if (!rows?.length) return [];

  const updates = rows.map((row) => ({
    id: row.id,
    recommended_workers: calculateRecommendedWorkers({
      minWorkers: row.min_workers,
      maxWorkers: row.max_workers,
      queueDepth: row.queue_depth,
      cpuLoad: row.cpu_load,
    }),
  }));

  return updates;
}
