export async function runPythonPipeline({ imagePaths }) {
  const base = process.env.PY_AI_URL;
  if (!base) throw new Error("PY_AI_URL not set");

  const res = await fetch(`${base}/pipeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagePaths })
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Python AI error: ${t || res.status}`);
  }
  return await res.json(); // { studio, damage, recognition }
}
