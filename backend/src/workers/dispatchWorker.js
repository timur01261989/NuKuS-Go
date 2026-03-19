import { enqueueDispatch } from '../../../server/_shared/queue/orderDispatchQueue.js';

export async function dispatchWorker(job) {
  return enqueueDispatch(job);
}
