export function calculateSettlement({ ridePrice, commissionPercent = 0 }) {
  const gross = Number(ridePrice || 0);
  const commissionRate = Math.max(0, Number(commissionPercent || 0));
  const commission = Number(((gross * commissionRate) / 100).toFixed(2));
  const driverPayout = Number((gross - commission).toFixed(2));

  return {
    gross,
    commissionPercent: commissionRate,
    commission,
    driverPayout,
  };
}
