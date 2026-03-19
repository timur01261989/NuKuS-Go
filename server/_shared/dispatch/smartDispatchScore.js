export function calculateDriverScore(driver = {}, order = {}) {
  const distance = Number(driver.distance ?? driver.dist_km ?? 0);
  const rating = Number(driver.rating ?? 4.5);
  const acceptanceRate = Number(driver.acceptance_rate ?? 0.5);
  const eta = Number(driver.eta_min ?? 0);

  const distanceScore = 1 / (distance + 1);
  const ratingScore = rating / 5;
  const acceptanceScore = acceptanceRate;
  const etaScore = 1 / (eta + 1);

  return Number(((distanceScore * 0.35) + (ratingScore * 0.25) + (acceptanceScore * 0.2) + (etaScore * 0.2)).toFixed(6));
}

export function sortDriversByScore(drivers = [], order = {}) {
  return [...drivers]
    .map((driver) => ({
      ...driver,
      dispatch_score: calculateDriverScore(driver, order),
    }))
    .sort((a, b) => b.dispatch_score - a.dispatch_score);
}
