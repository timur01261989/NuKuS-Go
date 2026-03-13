import { getServiceSupabase } from "../_shared/supabase.js";
import {
  claimQueuedDispatchJobs,
  incrementDispatchJobAttempts,
  markDispatchJobDone,
  markDispatchJobProcessing,
} from "../_shared/queue/dispatchQueueService.js";

async function processDispatchQueue() {
  const supabase = getServiceSupabase();
  const jobs = await claimQueuedDispatchJobs({ supabase, limit: 5 });

  for (const job of jobs) {
    try {
      await markDispatchJobProcessing({ supabase, jobId: job.id });

      const { error } = await supabase.rpc("dispatch_match_order_phase7", {
        p_order_id: job.order_id,
      });

      if (error) {
        throw error;
      }

      await markDispatchJobDone({ supabase, jobId: job.id });
    } catch (error) {
      console.error("dispatchQueueWorker error", error);
      await incrementDispatchJobAttempts({ supabase, jobId: job.id }).catch(() => null);
    }
  }
}

setInterval(() => {
  processDispatchQueue().catch((error) => {
    console.error("dispatchQueueWorker loop error", error);
  });
}, 2000);
