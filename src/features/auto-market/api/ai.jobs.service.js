import { axiosClient } from "./axiosClient";

/**
 * AI Jobs API (Pipeline)
 *
 * Contract:
 * - createAiJob(payload) -> { jobId }
 * - getAiJob(jobId) -> { jobId, status, progress, steps, result, error }
 *
 * If backend is NOT ready yet, we run a deterministic in-memory mock based on time.
 */

const mockStore = new Map();

function makeId() {
  return `job_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export async function createAiJob({ images = [], video = null, meta = {} } = {}) {
  const hasBackend = Boolean(axiosClient?.defaults?.baseURL);

  if (hasBackend) {
    const form = new FormData();
    images.forEach((f) => form.append("images", f));
    if (video) form.append("video", video);
    form.append("meta", JSON.stringify(meta));

    const { data } = await axiosClient.post("/ai/jobs", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data; // { jobId }
  }

  // Mock: store start time and simulate step completion.
  const jobId = makeId();
  mockStore.set(jobId, { startedAt: Date.now(), meta, imagesCount: images.length });
  return { jobId };
}

export async function getAiJob(jobId) {
  const hasBackend = Boolean(axiosClient?.defaults?.baseURL);

  if (hasBackend) {
    const { data } = await axiosClient.get(`/ai/jobs/${jobId}`);
    return data;
  }

  const job = mockStore.get(jobId);
  if (!job) {
    return { jobId, status: "error", progress: 0, error: "Job not found" };
  }

  const elapsed = Date.now() - job.startedAt;

  // Timeline (ms): tune to feel real
  const t1 = 1500; // studio done
  const t2 = 2800; // damage done
  const t3 = 4200; // recognition done
  const total = 5200;

  const progress = Math.min(100, Math.round((elapsed / total) * 100));

  const steps = {
    studio: elapsed >= t1 ? { status: "done", output: { imagesProcessed: job.imagesCount } } : { status: "running" },
    damage: elapsed >= t2 ? { status: "done", output: { issues: ["Old bamperda tirnalish aniqlandi (demo)"] } } : { status: elapsed >= t1 ? "running" : "queued" },
    recognition: elapsed >= t3 ? { status: "done", output: { query: "chevrolet malibu (demo)", similarIds: [] } } : { status: elapsed >= t2 ? "running" : "queued" },
  };

  const status = elapsed >= total ? "done" : "running";

  return {
    jobId,
    status,
    progress,
    steps,
    result: status === "done" ? { ...steps } : null,
    error: null,
  };
}

/**
 * Realtime job events (SSE)
 * Backend endpoint: GET /ai/jobs/:jobId/events
 * Falls back gracefully if not supported.
 */
export function subscribeAiJobEvents(jobId, onEvent) {
  try {
    const url = `${axiosClient.defaults.baseURL}/ai/jobs/${jobId}/events`;
    const es = new EventSource(url, { withCredentials: false });
    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        onEvent?.(data);
      } catch (_) {}
    };
    es.onerror = () => {
      // Let caller decide whether to close; browsers auto-retry.
    };
    return () => es.close();
  } catch (_) {
    return () => {};
  }
}
