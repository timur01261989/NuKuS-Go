import { json, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';
import { claimJobs, finishJob } from '../_shared/queue.js';
import { log } from '../_shared/logger.js';

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.WORKER_SECRET);
}

async function handleJob(sb, job) {
  if (job.type === 'send_push') {
    // Delegate to your existing /api/push/send by calling its logic OR inline FCM send.
    // Here we just log; you can replace with actual call.
    log('info','send_push job', job.payload);
    return true;
  }
  if (job.type === 'dispatch_tick') {
    log('info','dispatch_tick job', job.payload);
    return true;
  }
  return true;
}

/**
 * POST /api/worker/run
 * header: x-worker-secret: <WORKER_SECRET>
 * Runs a small batch of queued jobs.
 */
export default async function handler(req, res) {
  try {
    if (!hasEnv()) return serverError(res, 'Missing env (SUPABASE + WORKER_SECRET)');
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });

    const secret = req.headers['x-worker-secret'] || req.headers['X-Worker-Secret'];
    if (String(secret || '') !== String(process.env.WORKER_SECRET)) {
      return json(res, 403, { ok:false, error:'Forbidden' });
    }

    const sb = getSupabaseAdmin();
    const workerId = `worker-${Math.random().toString(16).slice(2)}`;

    const jobs = await claimJobs({ sb, workerId, limit: 10 });
    let ok = 0, failed = 0;

    for (const j of jobs) {
      try {
        const done = await handleJob(sb, j);
        await finishJob({ sb, id: j.id, ok: !!done });
        ok += 1;
      } catch (e) {
        failed += 1;
        await finishJob({ sb, id: j.id, ok: false, errorMsg: e?.message || String(e) });
      }
    }

    return json(res, 200, { ok:true, processed: jobs.length, ok_count: ok, failed_count: failed });
  } catch (e) {
    return serverError(res, e?.message || String(e));
  }
}