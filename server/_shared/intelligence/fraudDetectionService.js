export function detectOrderFraudSignals({ distanceKm = 0, priceUzs = 0, cancelCount24h = 0, createCount10m = 0 }) {
  const flags = [];
  if (Number(createCount10m) >= 5) flags.push('rapid_recreate');
  if (Number(cancelCount24h) >= 5) flags.push('high_cancellation');
  if (Number(distanceKm) <= 0.2 && Number(priceUzs) >= 50000) flags.push('anomalous_short_trip_price');
  return { suspicious: flags.length > 0, flags };
}
