import express from "express";
import cors from "cors";
import multer from "multer";
import { nanoid } from "nanoid";
import { aiQueue } from "./queue.js";
import { getJob, initJob } from "./store.js";
import { saveBufferToDisk } from "./storage.js";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || true
}));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.AI_UPLOAD_MAX_BYTES || 8 * 1024 * 1024), files: 10 } });

/**
 * POST /ai/jobs
 * form-data: images[] (max 10), meta (json string optional)
 */
app.post("/ai/jobs", upload.array("images", 10), async (req, res) => {
  const jobId = `job_${nanoid(10)}`;
  initJob(jobId);

  const files = req.files || [];
  const imagePaths = [];
  for (const f of files) {
    const mime = String(f?.mimetype || "").toLowerCase();
    if (mime && !mime.startsWith("image/")) {
      return res.status(400).json({ error: "Only image uploads are supported" });
    }
  }
  for (const f of files) {
    const p = await saveBufferToDisk({ jobId, filename: f.originalname, buffer: f.buffer });
    imagePaths.push(p);
  }

  await aiQueue.add(
    "pipeline",
    { jobId, imagePaths, meta: req.body?.meta || null },
    { removeOnComplete: true, removeOnFail: true }
  );

  res.json({ jobId });
});

/**
 * GET /ai/jobs/:jobId
 */
app.get("/ai/jobs/:jobId", (req, res) => {
  const s = getJob(req.params.jobId);
  if (!s) return res.status(404).json({ error: "Job not found" });
  res.json(s);
});

app.get("/health", (_, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 4000);

/**
 * SSE events for AI job progress (scale-friendly vs polling).
 * NOTE: This demo implementation pushes snapshot every 1s.
 * In production, publish events from worker via Redis Streams/PubSub and forward here.
 */
app.get("/ai/jobs/:jobId/events", (req, res) => {
  const jobId = req.params.jobId;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = () => {
    const s = getJob(jobId);
    if (!s) {
      res.write(`data: ${JSON.stringify({ jobId, status: "error", error: "Job not found" })}\n\n`);
      return;
    }
    res.write(`data: ${JSON.stringify(s)}\n\n`);
    if (s.status === "done" || s.status === "error") {
      // close after final state
      clearInterval(timer);
      res.end();
    }
  };

  send();
  const timer = setInterval(send, 1000);

  req.on("close", () => {
    clearInterval(timer);
  });
});

app.listen(port, () => console.log(`AI backend listening on :${port}`));
