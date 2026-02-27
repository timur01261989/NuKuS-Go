// Add-only: provider config with safe defaults (OSM/OSRM)
const KEY = 'NUKUSGO_PROVIDER_CONFIG_v1';

const defaults = {
  map_provider: (import.meta?.env?.VITE_MAP_PROVIDER || 'OSM').toUpperCase(),
  route_provider: (import.meta?.env?.VITE_ROUTE_PROVIDER || 'OSRM').toUpperCase(),
  traffic_provider: (import.meta?.env?.VITE_TRAFFIC_PROVIDER || 'NONE').toUpperCase(),
};

export function getProviderConfig() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const obj = JSON.parse(raw);
    return { ...defaults, ...obj };
  } catch {
    return { ...defaults };
  }
}

export function setProviderConfig(next) {
  const cur = getProviderConfig();
  const merged = { ...cur, ...(next||{}) };
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}
