import React, { memo } from "react";
import { calculationAssets } from "@/assets/calculation";
import { taxiPricingReminderFlow } from "../taxiPricingGuidance";

function TaxiHeader({ children, showPricingHints = false, hintLimit = 2 }) {
  const hints = showPricingHints ? taxiPricingReminderFlow.slice(0, Math.max(1, hintLimit)) : [];
  return (
    <div className="space-y-3">
      {children}
      {hints.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2">
          {hints.map((hint) => (
            <div
              key={hint.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm"
            >
              <img src={calculationAssets.pricing.access} alt="" className="mt-0.5 h-5 w-5 object-contain" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">{hint.title}</div>
                <div className="text-xs text-slate-500">{hint.summary}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default memo(TaxiHeader);
