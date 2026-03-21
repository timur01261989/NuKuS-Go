import { calculationAssets } from "@/assets/calculation";
import { resolveTaxiPriceState } from "./taxiPricingGuidance";

export function buildFareExplainer({ surgeMultiplier = 1, isDiscounted = false, hasAccess = true } = {}) {
  const state = resolveTaxiPriceState({ surgeMultiplier, isDiscounted, hasAccess });
  const iconMap = {
    fair: calculationAssets.pricing.fair,
    surgeUp: calculationAssets.pricing.surgeUp,
    down: calculationAssets.pricing.down,
    access: calculationAssets.pricing.access,
  };
  return {
    title: state.label,
    description: state.description,
    icon: iconMap[state.key] || calculationAssets.pricing.fair,
  };
}
