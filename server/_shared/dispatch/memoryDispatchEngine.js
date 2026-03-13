function toRad(value) {
  return (Number(value || 0) * Math.PI) / 180;
}

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  if (
    lat1 == null || lng1 == null ||
    lat2 == null || lng2 == null
  ) {
    return 9999;
  }

  const R = 6371;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLng = toRad(Number(lng2) - Number(lng1));
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreDriver(driver, order) {
  const distanceKm = haversineDistanceKm(
    driver.lat,
    driver.lng,
    order.pickup_lat,
    order.pickup_lng
  );

  const rating = Number(driver.rating || 4.5);
  const acceptance = Number(driver.acceptance_rate || 0.75);
  const priority = Number(driver.priority || 0.5);

  const distanceScore = Math.max(0, 1 - distanceKm / 10);
  const ratingScore = rating / 5;
  const acceptanceScore = acceptance;

  const finalScore =
    distanceScore * 0.5 +
    ratingScore * 0.25 +
    acceptanceScore * 0.15 +
    priority * 0.10;

  return {
    ...driver,
    driver_id: driver.driver_id || driver.id,
    distance_km: Number(distanceKm.toFixed(4)),
    score: Number((finalScore * 100).toFixed(4)),
  };
}

export function matchDriversInMemory({ drivers = [], order, limit = 10 }) {
  const ranked = drivers
    .map((driver) => scoreDriver(driver, order))
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit);
}
