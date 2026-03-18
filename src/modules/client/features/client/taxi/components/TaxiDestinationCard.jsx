import React, { memo } from "react";
import { buildFareExplainer } from "../taxiFareExplainer";

function TaxiDestinationCard({ children, surgeMultiplier = 1, isDiscounted = false, hasAccess = true }) {
  const explainer = buildFareExplainer({ surgeMultiplier, isDiscounted, hasAccess });
  return (
    <div className="space-y-3">
      {children}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
        <img src={explainer.icon} alt="" className="h-10 w-10 rounded-xl object-contain" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{explainer.title}</div>
          <div className="text-xs text-slate-500">{explainer.description}</div>
        </div>
      </div>
    </div>
  );
}

export default memo(TaxiDestinationCard);
