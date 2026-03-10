export function money(n) {
  const x = Math.round(Number(n || 0));
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
}

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function estimateTotalPrice(distanceKm, tariff) {
  const d = Number(distanceKm || 0);
  return Math.round((Number(tariff?.base || 0) + d * Number(tariff?.perKm || 0)) * Number(tariff?.mult || 1));
}
