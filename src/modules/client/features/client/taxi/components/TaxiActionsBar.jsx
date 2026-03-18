import React, { memo } from "react";
import { calculationAssets } from "@/assets/calculation";

const actionCards = [
  {
    id: "promo",
    title: "Promokodni qo‘llash",
    description: "Chegirma va aksiyalarni safardan oldin tekshiring.",
    icon: calculationAssets.promo.badgeFill,
  },
  {
    id: "details",
    title: "Narx tafsiloti",
    description: "Safar narxining qanday shakllanganini ochib ko‘rish mumkin.",
    icon: calculationAssets.payment.details,
  },
  {
    id: "payment",
    title: "To‘lovni tasdiqlash",
    description: "Karta, naqd yoki korporativ holatni ajratib ko‘rsatish kerak.",
    icon: calculationAssets.payment.card,
  },
];

function TaxiActionsBar({ children, showInsights = false }) {
  return (
    <div className="space-y-3">
      {children}
      {showInsights ? (
        <div className="grid gap-2 md:grid-cols-3">
          {actionCards.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <img src={item.icon} alt="" className="h-5 w-5 object-contain" />
                <div className="text-sm font-semibold text-slate-900">{item.title}</div>
              </div>
              <div className="text-xs text-slate-500">{item.description}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default memo(TaxiActionsBar);
