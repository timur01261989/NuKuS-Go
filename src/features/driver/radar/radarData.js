let cache = null;

export async function loadRadarData() {
  if (cache) return cache;
  try {
    const res = await fetch('/config/radars.json', { cache: 'no-store' });
    const data = await res.json();
    cache = Array.isArray(data?.items) ? data.items.filter((x) => x?.active !== false) : [];
    return cache;
  } catch {
    cache = [];
    return cache;
  }
}
