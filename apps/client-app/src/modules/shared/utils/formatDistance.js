export default function formatDistance(valueKm) {
  const value = Number(valueKm || 0);
  if (value < 1) return `${Math.round(value * 1000)} m`;
  return `${value.toFixed(1)} km`;
}
