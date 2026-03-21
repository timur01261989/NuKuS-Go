import React, { memo } from 'react';

function SurgeBadge({ multiplier = 1 }) {
  if (Number(multiplier) <= 1) return null;
  return (
    <div className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 shadow-sm">
      Surge x{multiplier}
    </div>
  );
}

export default memo(SurgeBadge);
