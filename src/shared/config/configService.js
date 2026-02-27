// GIS-level config loader (safe, non-breaking)
// Loads JSON from /public/config/*.json at runtime.
// If missing/unavailable, falls back to defaults. Does NOT change app behavior unless you read config.

const mem = new Map();

async function fetchJson(path) {
  try {
    const r = await fetch(path, { cache: 'no-cache' });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function loadConfig(name, fallback) {
  if (mem.has(name)) return mem.get(name);
  const data = await fetchJson(`/config/${name}.json`);
  const cfg = data || fallback;
  mem.set(name, cfg);
  return cfg;
}

export function clearConfigCache() {
  mem.clear();
}
