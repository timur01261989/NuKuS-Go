import { buildDispatchWaves } from "../_shared/dispatch/waveDispatchService.js";
import { matchDriversInMemory } from "../_shared/dispatch/memoryDispatchEngine.js";
import { pushDispatchEvent } from "../_shared/dispatch/realtimeDispatchService.js";

export async function runGlobalDispatchWorker({ supabase, wsServer, candidateDrivers = [] }) {
  const { data: jobs } = await supabase
    .from("dispatch_job_queue")
    .select("*")
    .eq("status", "pending")
    .limit(50);

  if (!jobs?.length) return [];

  const processed = [];

  for (const job of jobs) {
    await supabase
      .from("dispatch_job_queue")
      .update({ status: "processing" })
      .eq("id", job.id);

    const order = job.payload || {};
    const ranked = matchDriversInMemory({
      drivers: candidateDrivers,
      order,
      limit: 11,
    });

    const waves = buildDispatchWaves(ranked, [3, 3, 5]);

    for (let waveIndex = 0; waveIndex < waves.length; waveIndex += 1) {
      const waveDrivers = waves[waveIndex] || [];
      if (!waveDrivers.length) continue;

      await supabase
        .from("dispatch_waves")
        .insert({
          order_id: order.id,
          wave_index: waveIndex + 1,
        })
        .select("*")
        .maybeSingle()
        .catch(() => null);

      const driverIds = waveDrivers.map((d) => d.driver_id).filter(Boolean);

      if (driverIds.length) {
        pushDispatchEvent(wsServer, {
          order_id: order.id,
          driver_ids: driverIds,
          wave_index: waveIndex + 1,
          event: "wave_dispatch_offer",
          service_type: order.service_type || "taxi",
        });
      }

      for (const driver of waveDrivers) {
        await supabase
          .from("dispatch_wave_offers")
          .insert({
            order_id: order.id,
            driver_id: driver.driver_id,
            wave_index: waveIndex + 1,
            offer_status: "sent",
            expires_at: new Date(Date.now() + 6000).toISOString(),
          })
          .catch(() => null);
      }
    }

    await supabase
      .from("dispatch_job_queue")
      .update({ status: "done" })
      .eq("id", job.id);

    processed.push(job.id);
  }

  return processed;
}
