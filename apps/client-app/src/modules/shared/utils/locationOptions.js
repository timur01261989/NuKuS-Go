import { loadConfig } from '../config/configService.js';
import { defaultLocationConfig } from '../config/defaults.js';

export async function getLocationWatchOptions() {
  const cfg = await loadConfig('location', defaultLocationConfig);
  return {
    enableHighAccuracy: !!cfg.watch?.enableHighAccuracy,
    timeout: cfg.watch?.timeoutMs ?? 15000,
    maximumAge: cfg.watch?.maximumAgeMs ?? 2000,
  };
}
