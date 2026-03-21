import { withAuth } from "../_shared/withAuth.js";
import { calculateDynamicPrice } from "../_shared/pricing/dynamicPricingService.js";

async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const result = calculateDynamicPrice({
    basePrice: req.body?.base_price,
    demandMultiplier: req.body?.demand_multiplier,
    trafficMultiplier: req.body?.traffic_multiplier,
    serviceFeeMultiplier: req.body?.service_fee_multiplier,
  });

  res.status(200).json(result);
}

export default withAuth(handler);
