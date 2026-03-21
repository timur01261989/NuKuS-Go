import { runDispatch } from '../orders/orderDispatchService.js';

const queue = [];
let running = false;

async function processQueue() {
  if (running) return;
  running = true;
  while (queue.length > 0) {
    const job = queue.shift();
    try {
      await runDispatch(job);
    } catch (error) {
      console.error('[orderDispatchQueue] dispatch error:', error);
    }
  }
  running = false;
}

export async function enqueueDispatch(job) {
  queue.push(job);
  void processQueue();
  return { ok: true, queued: queue.length };
}

export function getDispatchQueueSize() {
  return queue.length;
}
