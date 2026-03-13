import React, { memo } from 'react';

function TaxiEtaBadge({ etaMin, distanceKm }) {
  if (!etaMin) return null;
  return (
    <div className="rounded-2xl bg-white/90 px-3 py-2 text-sm shadow">
      <div className="font-semibold">Haydovchi {etaMin} min ichida keladi</div>
      {distanceKm != null ? <div className="text-xs opacity-70">Masofa: {distanceKm} km</div> : null}
    </div>
  );
}

export default memo(TaxiEtaBadge);
