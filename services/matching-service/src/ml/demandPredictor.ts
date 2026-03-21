/**
 * Demand Predictor — Time series forecasting
 * In production: replace with real LSTM model via TensorFlow.js or ML service
 */

export interface DemandPrediction {
  hour:           number;
  zone:           string;
  expected_orders: number;
  confidence:     number;
}

const PEAK_WEIGHTS: Record<number, number> = {
  7: 3.2, 8: 4.8, 9: 4.5, 12: 3.0, 13: 2.8,
  17: 4.2, 18: 4.9, 19: 4.5, 20: 3.5, 21: 2.5,
};

export function predictDemand(hour: number, zone: string, dayOfWeek: number): DemandPrediction {
  const base       = 50;
  const peakMult   = PEAK_WEIGHTS[hour] || 1.0;
  const weekendAdj = dayOfWeek >= 5 ? 0.7 : 1.0;
  const zoneAdj    = zone === "center" ? 1.5 : zone === "suburb" ? 0.7 : 1.0;

  const expected = Math.round(base * peakMult * weekendAdj * zoneAdj);

  return {
    hour,
    zone,
    expected_orders: expected,
    confidence: 0.82,
  };
}

export function predictNextHours(zone: string, dayOfWeek: number, hours = 3): DemandPrediction[] {
  const currentHour = new Date().getHours();
  return Array.from({ length: hours }, (_, i) => {
    const h = (currentHour + i) % 24;
    return predictDemand(h, zone, dayOfWeek);
  });
}
