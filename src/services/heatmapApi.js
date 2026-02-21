const API_BASE = (import.meta?.env?.VITE_API_BASE || '').replace(/\/$/, '');

export async function getHeatmap({ minutes=60, cell=0.02 } = {}) {
  const qs = new URLSearchParams({ minutes: String(minutes), cell: String(cell) });
  const r = await fetch(`${API_BASE}/api/heatmap?${qs.toString()}`);
  const j = await r.json().catch(()=>({}));
  if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}
