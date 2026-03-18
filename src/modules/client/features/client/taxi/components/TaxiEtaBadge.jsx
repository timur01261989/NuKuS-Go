import React, { memo } from 'react';
import { buildTaxiEtaMeta } from '@/modules/shared/taxi/utils/taxiProductSignals.js';

function TaxiEtaBadge({ etaMin, distanceKm, etaUpdatedAt, isFallback = false }) {
  if (!etaMin && distanceKm == null) return null;
  const etaMeta = buildTaxiEtaMeta({ etaMin, updatedAt: etaUpdatedAt });
  return (
    <div className="rounded-2xl bg-white/90 px-3 py-2 text-sm shadow">
      <div className="font-semibold">Haydovchi {etaMeta.etaLabel} ichida keladi</div>
      <div className="mt-1 text-xs opacity-70">
        Yangilandi: {etaMeta.freshnessLabel}
        {distanceKm != null ? ` • Masofa: ${distanceKm} km` : ""}
      </div>
      {isFallback ? (
        <div className="mt-1 text-[11px] text-amber-700">ETA taxminiy yo‘l bo‘yicha ko‘rsatildi</div>
      ) : null}
      {etaMeta.isStale ? (
        <div className="mt-1 text-[11px] text-rose-700">Joylashuv sekin yangilanmoqda</div>
      ) : null}
    </div>
  );
}

export default memo(TaxiEtaBadge);
