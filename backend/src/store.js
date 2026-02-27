export const jobState = new Map();

export function initJob(jobId) {
  const s = {
    jobId,
    status: "queued", // queued|running|done|error
    progress: 0,
    steps: {
      studio: { status: "queued" },
      damage: { status: "queued" },
      recognition: { status: "queued" }
    },
    result: null,
    error: null,
    createdAt: Date.now()
  };
  jobState.set(jobId, s);
  return s;
}

export function patchJob(jobId, patch) {
  const s = jobState.get(jobId);
  if (!s) return null;
  const next = { ...s, ...patch };
  jobState.set(jobId, next);
  return next;
}

export function patchStep(jobId, step, patch) {
  const s = jobState.get(jobId);
  if (!s) return null;
  s.steps[step] = { ...(s.steps[step] || {}), ...patch };
  jobState.set(jobId, s);
  return s;
}
