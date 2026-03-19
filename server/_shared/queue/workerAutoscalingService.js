export function calculateRecommendedWorkers({
  minWorkers = 1,
  maxWorkers = 10,
  queueDepth = 0,
  cpuLoad = 0,
}) {
  const queueBased = Math.ceil(Number(queueDepth || 0) / 50) || 1;
  const cpuPenalty = Number(cpuLoad || 0) > 0.85 ? -1 : 0;
  const recommended = Math.max(minWorkers, Math.min(maxWorkers, queueBased + cpuPenalty));
  return recommended;
}
