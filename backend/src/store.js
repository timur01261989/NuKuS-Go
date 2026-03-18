import fs from "fs";
import path from "path";

const STATE_DIR = process.env.AI_JOB_STATE_DIR || path.join(process.cwd(), ".ai-job-state");
fs.mkdirSync(STATE_DIR, { recursive: true });

export const jobState = new Map();

function stateFile(jobId) {
  return path.join(STATE_DIR, `${jobId}.json`);
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function readFileState(jobId) {
  try {
    const raw = fs.readFileSync(stateFile(jobId), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeFileState(jobId, state) {
  const tmp = `${stateFile(jobId)}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tmp, stateFile(jobId));
}

export function getJob(jobId) {
  const cached = jobState.get(jobId);
  if (cached) return clone(cached);
  const disk = readFileState(jobId);
  if (disk) {
    jobState.set(jobId, disk);
    return clone(disk);
  }
  return null;
}

export function initJob(jobId) {
  const s = {
    jobId,
    status: "queued",
    progress: 0,
    steps: {
      studio: { status: "queued" },
      damage: { status: "queued" },
      recognition: { status: "queued" }
    },
    result: null,
    error: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  jobState.set(jobId, s);
  writeFileState(jobId, s);
  return clone(s);
}

export function patchJob(jobId, patch) {
  const s = getJob(jobId);
  if (!s) return null;
  const next = { ...s, ...patch, updatedAt: Date.now() };
  jobState.set(jobId, next);
  writeFileState(jobId, next);
  return clone(next);
}

export function patchStep(jobId, step, patch) {
  const s = getJob(jobId);
  if (!s) return null;
  const next = {
    ...s,
    steps: {
      ...(s.steps || {}),
      [step]: { ...((s.steps || {})[step] || {}), ...patch }
    },
    updatedAt: Date.now()
  };
  jobState.set(jobId, next);
  writeFileState(jobId, next);
  return clone(next);
}

export function removeJob(jobId) {
  jobState.delete(jobId);
  try {
    fs.unlinkSync(stateFile(jobId));
  } catch {}
}
