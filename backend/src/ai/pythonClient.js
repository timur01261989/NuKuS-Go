export async function runPythonPipeline({ imagePaths }) {
  const rawBase = process.env.PY_AI_URL;
  if (!rawBase) throw new Error("PY_AI_URL not set");
  const base = String(rawBase).replace(/\/$/, "");

  const res = await fetch(`${base}/pipeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagePaths }),
    signal: AbortSignal.timeout(Number(process.env.PY_AI_TIMEOUT_MS || 30_000)),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Python AI error: ${t || res.status}`);
  }
  return await res.json();
}
