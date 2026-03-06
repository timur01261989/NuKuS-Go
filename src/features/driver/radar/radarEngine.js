import { bearingDelta, haversineMeters } from './radarUtils';

const DEFAULT_THRESHOLDS = {
  notice: 800,
  warning: 350,
  danger: 150,
};

export function findNearestRadar({ position, heading, radars = [], maxDistance = 1200 }) {
  if (!position?.lat || !position?.lng) return null;
  let best = null;
  for (const radar of radars) {
    const distance = haversineMeters(position, radar);
    if (!Number.isFinite(distance) || distance > maxDistance) continue;
    const delta = radar?.heading == null ? 0 : bearingDelta(heading, radar.heading);
    if (radar?.heading != null && delta > 80) continue;
    if (!best || distance < best.distance) {
      best = { ...radar, distance, headingDelta: delta };
    }
  }
  return best;
}

export function getRadarSeverity(distance, speedKmh = 0, speedLimit = null, thresholds = DEFAULT_THRESHOLDS) {
  if (!Number.isFinite(distance)) return 'idle';
  if (distance <= thresholds.danger) return speedLimit && speedKmh > speedLimit ? 'overspeed' : 'danger';
  if (distance <= thresholds.warning) return speedLimit && speedKmh > speedLimit ? 'overspeed' : 'warning';
  if (distance <= thresholds.notice) return 'notice';
  return 'idle';
}
