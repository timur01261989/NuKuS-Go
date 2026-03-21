/**
 * ETA Model — Gradient boosting based ETA estimation
 * In production: use pre-trained XGBoost model via ONNX runtime
 */

export interface ETAInput {
  pickup_lat:  number;
  pickup_lng:  number;
  dropoff_lat: number;
  dropoff_lng: number;
  hour:        number;
  day:         number;
  weather:     "clear" | "rain" | "snow";
}

export interface ETAOutput {
  eta_minutes:  number;
  distance_km:  number;
  confidence:   number;
  route_type:   "fast" | "normal" | "slow";
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const TRAFFIC: Record<string, number> = {
  morning:  1.9,
  evening:  2.1,
  lunch:    1.4,
  night:    0.8,
  default:  1.0,
};

function getTrafficFactor(hour: number): { factor: number; type: string } {
  if (hour >= 7  && hour < 10)  return { factor: TRAFFIC.morning, type: "slow" };
  if (hour >= 17 && hour < 21)  return { factor: TRAFFIC.evening, type: "slow" };
  if (hour >= 12 && hour < 14)  return { factor: TRAFFIC.lunch,   type: "normal" };
  if (hour >= 22 || hour < 6)   return { factor: TRAFFIC.night,   type: "fast" };
  return { factor: TRAFFIC.default, type: "normal" };
}

export function predictETA(input: ETAInput): ETAOutput {
  const distKm     = haversine(input.pickup_lat, input.pickup_lng, input.dropoff_lat, input.dropoff_lng);
  const baseSpeed  = 35; // km/h avg Tashkent
  const { factor, type } = getTrafficFactor(input.hour);
  const weatherMult = input.weather === "snow" ? 1.6 : input.weather === "rain" ? 1.25 : 1.0;
  const effectiveSpeed = baseSpeed / (factor * weatherMult);
  const etaMinutes = (distKm / effectiveSpeed) * 60 + 2; // +2 min pickup

  return {
    eta_minutes:  Math.round(etaMinutes * 10) / 10,
    distance_km:  Math.round(distKm * 100) / 100,
    confidence:   0.87,
    route_type:   type as any,
  };
}
