export function smoothPoint(prev, next, alpha = 0.35) {
  if (!prev) return next;
  if (!next) return prev;
  const lat = prev.lat + alpha * (next.lat - prev.lat);
  const lng = prev.lng + alpha * (next.lng - prev.lng);
  return { ...next, lat, lng, bearing: (next.bearing ?? prev.bearing), speed: (next.speed ?? prev.speed) };
}
