export function calculateSurge({ activeOrders, activeDrivers }) {
  if (!activeDrivers) return 1;
  const ratio = activeOrders / activeDrivers;
  if (ratio > 5) return 3;
  if (ratio > 3) return 2;
  if (ratio > 2) return 1.5;
  return 1;
}

export function calculateTripPrice({
  basePrice = 0,
  seats = 1,
  bookedSeats = 0,
  totalSeats = 4,
  amenities = {},
  luggageCount = 0,
  childSeatTypes = [],
  waitingMinutes = 0,
  exactPickup = false,
  meetAndGreet = false,
  isAirportTransfer = false,
}) {
  let total = Number(basePrice || 0) * Math.max(1, Number(seats || 1));
  const occupancyRatio = totalSeats > 0 ? bookedSeats / totalSeats : 0;
  if (occupancyRatio >= 0.75) total *= 1.15;
  if (occupancyRatio >= 0.9) total *= 1.1;
  if (exactPickup) total += 10000;
  if (meetAndGreet) total += 15000;
  if (isAirportTransfer) total += 20000;
  total += Math.max(0, Number(luggageCount || 0)) * 7000;
  total += (Array.isArray(childSeatTypes) ? childSeatTypes.length : 0) * 12000;
  total += Math.max(0, Number(waitingMinutes || 0)) * 1000;
  if (amenities?.wifi) total += 5000;
  if (amenities?.charger) total += 3000;
  if (amenities?.refreshments) total += 7000;
  if (amenities?.wheelchair_accessible) total += 12000;
  return Math.round(total);
}
