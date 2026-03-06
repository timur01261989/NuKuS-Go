let lastRadarId = null;
let lastSeverity = null;
let lastPlayedAt = 0;

export function shouldPlayRadarAlert(radarId, severity) {
  const now = Date.now();
  if (!radarId || severity === 'idle') return false;
  if (radarId !== lastRadarId) {
    lastRadarId = radarId;
    lastSeverity = severity;
    lastPlayedAt = now;
    return true;
  }
  if (severity !== lastSeverity && now - lastPlayedAt > 2500) {
    lastSeverity = severity;
    lastPlayedAt = now;
    return true;
  }
  return false;
}

export function playRadarAlert() {
  try {
    const audio = new Audio('/sounds/speed_cams_beep.m4a');
    audio.volume = 1;
    void audio.play();
  } catch {}
}
