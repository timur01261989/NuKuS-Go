export function calculateDriverBonus({ completedTrips = 0, cancellationRate = 0, rating = 5 }) {
  let bonus = 0;
  if (completedTrips >= 20) bonus += 10000;
  if (completedTrips >= 50) bonus += 15000;
  if (Number(rating) >= 4.8) bonus += 5000;
  if (Number(cancellationRate) <= 0.03) bonus += 5000;
  return { bonus_uzs: bonus, completedTrips, cancellationRate, rating };
}
