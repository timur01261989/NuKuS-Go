import { getProviderConfig } from '../../services/providerConfig.js';
import { osrmRoute } from './osrmRoute.js';
import { yandexRoute } from './yandexRoute.js';
import { googleRoute } from './googleRoute.js';

export async function buildRoute(args) {
  const cfg = getProviderConfig();
  const p = (cfg.route_provider || 'OSRM').toUpperCase();
  if (p === 'YANDEX') return yandexRoute(args);
  if (p === 'GOOGLE') return googleRoute(args);
  return osrmRoute(args);
}
