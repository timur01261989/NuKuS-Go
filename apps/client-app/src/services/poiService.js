import { loadConfig } from '../shared/config/configService.js';
import { defaultPoiConfig } from '../shared/config/defaults_osm.js';

function haversineM(a, b) {
  const R = 6371000;
  const toRad = (x) => x * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const CACHE_KEY = 'nukusgo_poi_cache_v1';

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function saveCache(obj) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(obj)); } catch {}
}

function cacheKey({ lat, lon, radius_m, cat }) {
  return `${cat||'all'}:${Math.round(lat*1000)}:${Math.round(lon*1000)}:${radius_m}`;
}

export async function getCategories() {
  const cfg = await loadConfig('poi', defaultPoiConfig);
  return cfg.categories || [];
}

export async function searchPoi({ lat, lon, radius_m, categoryId }) {
  const cfg = await loadConfig('poi', defaultPoiConfig);
  const radius = radius_m ?? cfg.radius_m_default ?? 2000;
  const key = cacheKey({ lat, lon, radius_m: radius, cat: categoryId || 'all' });

  const cache = loadCache();
  const cached = cache[key];
  if (cached && (Date.now() - cached.ts) < 1000 * 60 * 10) { // 10 min
    return cached.items;
  }

  let items = [];
  if ((cfg.provider || 'local') === 'overpass') {
    items = await searchOverpass({ cfg, lat, lon, radius, categoryId });
  } else {
    items = searchLocal({ cfg, lat, lon, radius, categoryId });
  }

  cache[key] = { ts: Date.now(), items };
  saveCache(cache);
  return items;
}

function searchLocal({ cfg, lat, lon, radius, categoryId }) {
  const all = cfg?.local_sample?.pois || [];
  const center = { lat, lon };
  return all
    .filter(p => !categoryId || p.cat === categoryId)
    .map(p => ({ ...p, distance_m: haversineM(center, p) }))
    .filter(p => p.distance_m <= radius)
    .sort((a,b)=>a.distance_m-b.distance_m);
}

async function searchOverpass({ cfg, lat, lon, radius, categoryId }) {
  const endpoint = cfg?.overpass?.endpoint;
  if (!endpoint) return [];
  const cat = (cfg.categories || []).find(c => c.id === categoryId) || null;
  const tags = cat?.tags || [];

  // Build Overpass QL (simple)
  // NOTE: Overpass is optional; if blocked, app still works with local provider.
  const around = `around:${Math.round(radius)},${lat},${lon}`;
  const parts = tags.length ? tags.map(t => `nwr[${t.key}=${JSON.stringify(t.value)}](${around});`).join('\n')
                            : `nwr(${around});`;
  const query = `[out:json][timeout:${cfg?.overpass?.timeout_s || 20}];\n(${parts});\nout center;`;

  const r = await fetch(endpoint, { method:'POST', body: query });
  if (!r.ok) return [];
  const data = await r.json();
  const els = data?.elements || [];
  return els.map(e => {
    const pLat = e.lat ?? e.center?.lat;
    const pLon = e.lon ?? e.center?.lon;
    const name = e.tags?.name || e.tags?.brand || 'POI';
    return { id: String(e.id), name, lat: pLat, lon: pLon, cat: categoryId || 'all' };
  }).filter(p => p.lat && p.lon);
}
