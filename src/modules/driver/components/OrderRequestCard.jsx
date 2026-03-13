import React from "react";

function OrderRequestCard({ title = "New Order", children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}

export default React.memo(OrderRequestCard);
