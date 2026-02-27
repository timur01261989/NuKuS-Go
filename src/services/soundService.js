import { loadConfig } from '../shared/config/configService.js';
import { defaultSoundsConfig } from '../shared/config/defaults.js';

let audioCache = new Map();

export async function playSound(eventName) {
  const cfg = await loadConfig('sounds', defaultSoundsConfig);
  if (!cfg?.enabled) return;
  const url = cfg?.events?.[eventName];
  if (!url) return;

  let a = audioCache.get(url);
  if (!a) {
    a = new Audio(url);
    audioCache.set(url, a);
  }
  try { a.currentTime = 0; await a.play(); } catch { /* ignore */ }
}
