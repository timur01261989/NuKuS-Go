export function scoreAmenityBoost(trip = {}) {
  let boost = 0;
  if (trip.has_ac || trip.amenities?.has_ac) boost += 4;
  if (trip.has_trunk || trip.amenities?.has_trunk) boost += 3;
  if (trip.amenities?.wifi) boost += 3;
  if (trip.amenities?.charger) boost += 2;
  if (trip.amenities?.refreshments) boost += 2;
  if (trip.women_only) boost += 1;
  return boost;
}

export function scoreReliability(trip = {}) {
  const base = Number(trip.reliability_score ?? trip.driver_reliability_score ?? trip.driver_rating ?? 75);
  return Math.max(0, Math.min(20, Math.round(base / 5)));
}

export function scorePriceCompetitiveness(trip = {}, allTrips = []) {
  const price = Number(trip.price ?? trip.base_price_uzs ?? 0);
  const prices = allTrips.map((item) => Number(item.price ?? item.base_price_uzs ?? 0)).filter((v) => Number.isFinite(v) && v > 0);
  if (!price || !prices.length) return 0;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const ratio = price / avg;
  if (ratio <= 0.8) return 12;
  if (ratio <= 1) return 8;
  if (ratio <= 1.15) return 4;
  if (ratio <= 1.3) return 1;
  return -4;
}

export function rankTrips(trips = []) {
  const rows = Array.isArray(trips) ? trips : [];
  return rows
    .map((trip) => {
      const corridorScore = Number(trip.match_score ?? trip.corridor_match?.score ?? 0);
      const seatsLeft = Number(trip.available_seats ?? trip.inventory?.availableSeats ?? trip.seats_left ?? trip.seats ?? 0);
      const seatScore = seatsLeft <= 0 ? -30 : Math.min(10, seatsLeft * 2);
      const finalScore = corridorScore + scoreAmenityBoost(trip) + scoreReliability(trip) + scorePriceCompetitiveness(trip, rows) + seatScore;
      return {
        ...trip,
        ranking_score: finalScore,
      };
    })
    .sort((a, b) => b.ranking_score - a.ranking_score || Number(a.price ?? a.base_price_uzs ?? Infinity) - Number(b.price ?? b.base_price_uzs ?? Infinity));
}
