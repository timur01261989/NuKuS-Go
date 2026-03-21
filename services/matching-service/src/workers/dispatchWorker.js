import { enqueueDispatch } from '../_shared/queue/orderDispatchQueue.js';

export async function dispatchWorker(job) {
  if (!job || !job.supabase || !job.order) {
    throw new Error('invalid_dispatch_job');
  }
  return enqueueDispatch(job);
}
