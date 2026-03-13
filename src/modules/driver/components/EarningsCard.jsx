import React from "react";

function EarningsCard({ value = 0 }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">Earnings</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

export default React.memo(EarningsCard);
