export function computeSurgeMultiplier({ activeOrders = 0, onlineDrivers = 0, weatherFactor = 1, eventFactor = 1, maxMultiplier = 3 }) {
  const drivers = Math.max(1, Number(onlineDrivers) || 0);
  const orders = Math.max(0, Number(activeOrders) || 0);
  const ratio = orders / drivers;
  let multiplier = 1;
  if (ratio > 5) multiplier = 3;
  else if (ratio > 3) multiplier = 2;
  else if (ratio > 2) multiplier = 1.5;
  else if (ratio > 1.25) multiplier = 1.2;
  multiplier *= Math.max(0.8, Number(weatherFactor) || 1);
  multiplier *= Math.max(0.8, Number(eventFactor) || 1);
  multiplier = Math.min(Math.max(1, multiplier), Math.max(1, Number(maxMultiplier) || 3));
  return {
    multiplier: Number(multiplier.toFixed(2)),
    ratio: Number(ratio.toFixed(2)),
    surge_active: multiplier > 1,
  };
}
