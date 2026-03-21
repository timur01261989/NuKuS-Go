// server/_shared/pricing.js
// Minimal pricing engine with coefficients (extendable).
export function computeFare({ base=5000, per_km=2000, per_min=200, distance_km=0, duration_sec=0, demand=1, area=1 }) {
  const minutes = duration_sec / 60;
  const raw = base + (per_km * distance_km) + (per_min * minutes);
  const total = Math.round(raw * Math.max(0.7, demand) * Math.max(0.7, area));
  return { total, breakdown: { base, per_km, per_min, distance_km, duration_sec, demand, area } };
}