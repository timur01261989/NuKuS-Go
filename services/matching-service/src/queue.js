// server/_shared/queue.js
import { nowIso } from './cors.js';

export async function enqueue({ sb, type, payload, runAtIso=null }) {
  const row = {
    type,
    payload,
    status: 'queued',
    run_at: runAtIso || nowIso(),
    attempts: 0,
    updated_at: nowIso(),
    created_at: nowIso(),
  };
  const { data, error } = await sb.from('job_queue').insert([row]).select('*').single();
  if (error) throw error;
  return data;
}

// Simple claim to avoid double-processing; best effort.
export async function claimJobs({ sb, workerId, limit=10 }) {
  const now = nowIso();
  const { data, error } = await sb.from('job_queue')
    .select('*')
    .eq('status','queued')
    .lte('run_at', now)
    .order('run_at', { ascending: true })
    .limit(limit);
  if (error) throw error;

  const claimed = [];
  for (const j of (data || [])) {
    const { data: upd, error: ue } = await sb.from('job_queue')
      .update({ status:'processing', locked_by: workerId, locked_at: now, updated_at: now })
      .eq('id', j.id)
      .eq('status','queued')
      .select('*')
      .maybeSingle();
    if (!ue && upd) claimed.push(upd);
  }
  return claimed;
}

export async function finishJob({ sb, id, ok, errorMsg=null }) {
  const now = nowIso();
  if (ok) {
    await sb.from('job_queue').update({ status:'done', updated_at: now }).eq('id', id);
  } else {
    await sb.from('job_queue').update({
      status:'failed',
      attempts: sb.rpc ? undefined : undefined,
      last_error: errorMsg || 'failed',
      updated_at: now
    }).eq('id', id);
  }
}