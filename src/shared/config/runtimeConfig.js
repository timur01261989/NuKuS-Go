import { loadConfig } from './configService.js';
import { defaultUiConfig } from './defaults.js';

let uiCache = null;

export async function getUiRuntimeConfig() {
  if (uiCache) return uiCache;
  uiCache = await loadConfig('ui', defaultUiConfig);
  return uiCache;
}
