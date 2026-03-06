export function msToKmh(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n * 3.6);
}

export function smoothSpeed(prev, next) {
  if (!Number.isFinite(next)) return prev || 0;
  if (!Number.isFinite(prev)) return next;
  return prev * 0.45 + next * 0.55;
}
