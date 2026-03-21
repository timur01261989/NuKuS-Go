import React, { memo } from "react";
import SurgeBadge from "./SurgeBadge.jsx";
import { calculationAssets } from "@/assets/calculation";
import { resolveTaxiPriceState } from "../taxiPricingGuidance";

const stateVisuals = {
  fair: calculationAssets.pricing.fair,
  surgeUp: calculationAssets.pricing.surgeUp,
  down: calculationAssets.pricing.down,
  access: calculationAssets.pricing.access,
};

function FareStateChip({ surgeMultiplier = 1, isDiscounted = false, hasAccess = true }) {
  const state = resolveTaxiPriceState({ surgeMultiplier, isDiscounted, hasAccess });
  const icon = stateVisuals[state.key] || calculationAssets.pricing.fair;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-sm">
      <img src={icon} alt="" className="h-5 w-5 object-contain" />
      <div>
        <div className="font-semibold leading-4">{state.label}</div>
        <div className="text-xs text-slate-500">{state.description}</div>
      </div>
    </div>
  );
}

function TaxiFareCard({ children, surgeMultiplier = 1, isDiscounted = false, hasAccess = true }) {
  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <SurgeBadge multiplier={surgeMultiplier} />
        <FareStateChip
          surgeMultiplier={surgeMultiplier}
          isDiscounted={isDiscounted}
          hasAccess={hasAccess}
        />
      </div>
      {children}
    </>
  );
}

export default memo(TaxiFareCard);
