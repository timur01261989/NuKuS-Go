import React from "react";
import StatCard from "../../components/StatCard";

const MONTHLY = [
  { month: "Yan", revenue: 45, orders: 8200 },
  { month: "Fev", revenue: 52, orders: 9100 },
  { month: "Mar", revenue: 61, orders: 10800 },
];

const PROVIDERS = [
  { name: "Payme",  txns: 4820, volume: "124M", share: "42%" },
  { name: "Click",  txns: 3210, volume: "89M",  share: "31%" },
  { name: "Naqd",   txns: 2100, volume: "52M",  share: "18%" },
  { name: "UzCard", txns: 870,  volume: "21M",  share: "9%"  },
];

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-slate-800">Moliya</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Bugungi tushum" value="8.4M" icon="💰" trend={18} color="orange" />
        <StatCard title="Haftalik tushum" value="52M"  icon="📈" trend={11} color="green" />
        <StatCard title="Oylik tushum"   value="186M" icon="🏦" trend={23} color="blue" />
        <StatCard title="Qaytarishlar"   value="42K"  icon="↩️" trend={-2} color="purple" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-bold text-slate-800 mb-4">To'lov provayderlar</h3>
        <div className="space-y-3">
          {PROVIDERS.map(p => (
            <div key={p.name} className="flex items-center gap-4">
              <span className="w-16 text-sm font-semibold text-slate-700">{p.name}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full" style={{ width: p.share }} />
              </div>
              <span className="text-sm font-semibold text-slate-500 w-8">{p.share}</span>
              <span className="text-sm text-slate-700 w-24 text-right">{p.volume} so'm</span>
              <span className="text-xs text-slate-400">{p.txns} ta</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
