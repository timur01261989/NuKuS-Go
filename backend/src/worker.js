import { Worker } from "bullmq";
import { redis } from "./queue.js";
import { getJob, patchJob, patchStep } from "./store.js";
import { runMockPipeline } from "./ai/mock.js";
import { runPythonPipeline } from "./ai/pythonClient.js";

const MODE = process.env.AI_MODE || "mock"; // mock | python

new Worker(
  "ai-jobs",
  async (job) => {
    const { jobId, imagePaths } = job.data;

    patchJob(jobId, { status: "running", progress: 1, error: null });

    try {
      patchStep(jobId, "studio", { status: "running" });
      patchJob(jobId, { progress: 20 });
      patchStep(jobId, "damage", { status: "queued" });
      patchStep(jobId, "recognition", { status: "queued" });

      const out = MODE === "python"
        ? await runPythonPipeline({ imagePaths })
        : await runMockPipeline({ imagePaths });

      patchStep(jobId, "studio", { status: "done", output: out.studio });
      patchJob(jobId, { progress: 50 });

      patchStep(jobId, "damage", { status: "done", output: out.damage });
      patchJob(jobId, { progress: 75 });

      patchStep(jobId, "recognition", { status: "done", output: out.recognition });
      patchJob(jobId, {
        progress: 100,
        status: "done",
        result: { steps: getJob(jobId)?.steps || {} }
      });

      return { ok: true };
    } catch (e) {
      patchJob(jobId, { status: "error", error: e?.message || "AI failed" });
      // mark the first step as error for UI visibility
      patchStep(jobId, "studio", { status: "error" });
      throw e;
    }
  },
  { connection: redis }
);
