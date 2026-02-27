import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createAiJob, getAiJob, subscribeAiJobEvents } from "../../api/ai.jobs.service";
import { useAiProcess } from "../../context/AiProcessContext";

/**
 * AI Pipeline hook
 * - startPipeline(images|video) -> creates a job and starts polling
 * - status is stored in AiProcessContext so UI can render anywhere
 */
export function useAiPipeline() {
  const { state, setState } = useAiProcess();

  const createJob = useMutation({
    mutationFn: (payload) => createAiJob(payload),
    onMutate: () => {
      setState((s) => ({ ...s, status: "running", progress: 1, error: null }));
    },
    onError: (e) => {
      setState((s) => ({ ...s, status: "error", error: e?.message || "AI job create error" }));
    },
    onSuccess: (data) => {
      setState((s) => ({ ...s, jobId: data?.jobId, status: "running", progress: 5 }));
    },
  });

  const jobId = state.jobId;

  const jobQuery = useQuery({
    queryKey: ["aiJob", jobId],
    queryFn: () => getAiJob(jobId),
    enabled: Boolean(jobId) && state.status === "running",
    refetchInterval: 1000,
    staleTime: 0,
  });

  useEffect(() => {
    if (!jobQuery.data) return;

    const data = jobQuery.data;
    setState((s) => ({
      ...s,
      status: data.status || s.status,
      progress: typeof data.progress === "number" ? data.progress : s.progress,
      steps: data.steps || s.steps,
      result: data.result || s.result,
      error: data.error || null,
    }));

    if (data.status === "done" || data.status === "error") {
      // stop polling automatically by switching status
      setState((s) => ({ ...s, status: data.status }));
    }
  }, [jobQuery.data, setState]);


  useEffect(() => {
    if (!jobId) return;
    // Prefer SSE events to reduce polling load at scale.
    const unsub = subscribeAiJobEvents(jobId, (evt) => {
      if (!evt) return;
      setState((s) => ({
        ...s,
        status: evt.status || s.status,
        progress: typeof evt.progress === "number" ? evt.progress : s.progress,
        steps: evt.steps || s.steps,
        result: evt.result || s.result,
        error: evt.error || null,
      }));
    });
    return () => unsub?.();
  }, [jobId, setState]);

  const startPipeline = async ({ images = [], video = null, meta = {} } = {}) => {
    // Prevent multiple concurrent jobs from clobbering state accidentally.
    // If you want parallel jobs later, switch to "jobs[]" list in context.
    setState((s) => ({ ...s, jobId: null, steps: {}, result: null, error: null }));
    return createJob.mutateAsync({ images, video, meta });
  };

  const resetPipeline = () =>
    setState({ jobId: null, status: "idle", progress: 0, steps: {}, result: null, error: null });

  return {
    startPipeline,
    resetPipeline,
    creating: createJob.isPending,
    polling: jobQuery.isFetching,
    job: jobQuery.data || null,
    state,
  };
}
