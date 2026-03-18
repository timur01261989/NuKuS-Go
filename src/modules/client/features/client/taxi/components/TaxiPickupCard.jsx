import React, { memo } from "react";
import { calculationAssets } from "@/assets/calculation";

function TaxiPickupCard({ children, mode = "instant", paymentType = "card" }) {
  const isPrebook = String(mode).toLowerCase().includes("schedule");
  const isCash = String(paymentType).toLowerCase().includes("cash");
  const icon = isCash ? calculationAssets.payment.details : calculationAssets.payment.card;
  const title = isPrebook ? "Safar rejalashtirilgan" : "Safar tezkor buyurtma";
  const subtitle = isCash ? "To‘lov turi oldindan ko‘rinadi." : "Karta orqali to‘lov oldindan tekshiriladi.";
  return (
    <div className="space-y-3">
      {children}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 p-3 shadow-sm">
        <img src={icon} alt="" className="h-10 w-10 rounded-xl object-cover" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

export default memo(TaxiPickupCard);
