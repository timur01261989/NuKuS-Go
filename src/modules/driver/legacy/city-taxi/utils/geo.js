/**
 * geo.js
 * - silliq heading
 * - lerp (smooth marker)
 * - haversine (keyin kerak bo‘ladi)
 */
export function clamp360(d) {
  let x = Number(d || 0);
  while (x < 0) x += 360;
  while (x >= 360) x -= 360;
  return x;
}

export function shortestAngle(a, b) {
  const da = clamp360(a);
  const db = clamp360(b);
  let diff = db - da;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

export function smoothHeading(prev, nextRaw) {
  if (nextRaw == null || !Number.isFinite(nextRaw)) return prev || 0;
  const p = clamp360(prev || 0);
  const n = clamp360(nextRaw);
  const diff = shortestAngle(p, n);
  return clamp360(p + diff * 0.35);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpLatLng(cur, target, t) {
  return [lerp(cur[0], target[0], t), lerp(cur[1], target[1], t)];
}

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180;
  const lat2 = b[0] * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}

export function buildPolyline(from, to) {
  return [from, to];
}
