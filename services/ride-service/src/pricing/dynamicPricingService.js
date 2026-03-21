export function calculateDynamicPrice({
  basePrice = 0,
  demandMultiplier = 1,
  trafficMultiplier = 1,
  serviceFeeMultiplier = 1,
}) {
  const finalMultiplier = Number(demandMultiplier || 1) * Number(trafficMultiplier || 1) * Number(serviceFeeMultiplier || 1);
  const finalPrice = Number(basePrice || 0) * finalMultiplier;

  return {
    base_price: Number(basePrice || 0),
    demand_multiplier: Number(demandMultiplier || 1),
    traffic_multiplier: Number(trafficMultiplier || 1),
    service_fee_multiplier: Number(serviceFeeMultiplier || 1),
    final_multiplier: Number(finalMultiplier.toFixed(4)),
    final_price: Number(finalPrice.toFixed(2)),
  };
}
