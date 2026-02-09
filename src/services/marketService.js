import { getAllListings } from './marketStorage.js';
const API_BASE = (import.meta?.env?.VITE_API_BASE || '').replace(/\/$/, '');

import { loadConfig } from '../shared/config/configService.js';

const DEFAULT_CFG = {
  enabled: true,
  title: 'Avto savdo',
  cta_label: 'Savdoga kirish',
  data_source: 'local_json',
  local_json_path: '/config/market_listings.json',
  refresh_seconds: 60,
  ui: { show_preview_count: 6, currency: 'UZS' },
};

async function fetchJson(path) {
  const r = await fetch(path, { cache: 'no-cache' });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}

export async function getMarketConfig() {
  return await loadConfig('market', DEFAULT_CFG);
}

export async function listMarketCars({ limit, sort='newest' } = {}) {
  const cfg = await getMarketConfig();
  if (!cfg?.enabled) return [];

  // Prefer backend in production (if VITE_API_BASE set or same-origin empty handled below)
  const base = API_BASE || '';
  if (base !== null) {
    try {
      const qs = new URLSearchParams();
      if (typeof limit === 'number') qs.set('limit', String(limit));
      if (sort) qs.set('sort', String(sort));
      // If VITE_API_BASE is empty, fetch will go same-origin on Vercel
      const url = `${base}/api/market-listings?${qs.toString()}`;
      const r = await fetch(url, { cache: 'no-cache' });
      if (r.ok) {
        const j = await r.json();
        const apiItems = Array.isArray(j.items) ? j.items : [];
        if (apiItems.length) return apiItems;
      }
    } catch {
      // fall back
    }
  }

  const path = cfg.local_json_path || DEFAULT_CFG.local_json_path;
  const data = await fetchJson(path);
  const items = Array.isArray(data) ? data : [];
  const local = getAllListings();
  for (const x of (Array.isArray(local) ? local : [])) items.push(x);
  items.sort((a,b) => (new Date(b.created_at || 0)) - (new Date(a.created_at || 0)));
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}

export function formatPriceUZS(v) {
  const n = Number(v || 0);
  try {
    return new Intl.NumberFormat('uz-UZ').format(n) + " so‘m";
  } catch {
    return n.toString() + " so‘m";
  }
}
