import { getProviderConfig } from '../../services/providerConfig.js';

export function currentTrafficProvider() {
  const cfg = getProviderConfig();
  return (cfg.traffic_provider || 'NONE').toUpperCase();
}

export async function getTrafficOverlay() {
  const p = currentTrafficProvider();
  if (p === 'NONE') return { provider: 'NONE', available: false };
  if (p === 'YANDEX') return { provider: 'YANDEX', available: false, note: 'Placeholder (keyin ulanadi)' };
  if (p === 'GOOGLE') return { provider: 'GOOGLE', available: false, note: 'Placeholder (keyin ulanadi)' };
  return { provider: p, available: false };
}
