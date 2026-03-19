export function buildSettlement({ totalAmount = 0, platformPercent = 12, fleetPercent = 0, cancellationFee = 0 }) {
  const gross = Math.max(0, Number(totalAmount || 0));
  const platformFee = Math.round((gross * Number(platformPercent || 0)) / 100);
  const fleetFee = Math.round((gross * Number(fleetPercent || 0)) / 100);
  const cancellation = Math.max(0, Number(cancellationFee || 0));
  const driverNet = Math.max(0, gross - platformFee - fleetFee - cancellation);
  return {
    gross_amount_uzs: gross,
    platform_fee_uzs: platformFee,
    fleet_fee_uzs: fleetFee,
    cancellation_fee_uzs: cancellation,
    driver_net_uzs: driverNet,
  };
}
