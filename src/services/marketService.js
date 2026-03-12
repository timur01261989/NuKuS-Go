const API_BASE = (import.meta?.env?.VITE_API_BASE || '').replace(/\/$/, '');

export async function getMarketConfig() {
  return { enabled: false, title: 'Avto savdo', cta_label: 'Savdoga kirish' };
}

export async function listMarketCars() {
  const base = API_BASE || '';
  if (!base) return [];

  try {
    const r = await fetch(`${base}/api/market-listings`, { cache: 'no-cache' });
    if (!r.ok) return [];

    const j = await r.json().catch(() => ({}));
    return Array.isArray(j.items) ? j.items : [];
  } catch {
    return [];
  }
}

export function formatPriceUZS(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0 so'm";
  return `${Math.round(n).toLocaleString('ru-RU')} so'm`;
}
