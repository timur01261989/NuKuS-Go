import React from "react";

const HEATMAP_DATA = [
  { city: "Toshkent",   orders: 8240, drivers: 312 },
  { city: "Samarqand",  orders: 1820, drivers: 68 },
  { city: "Buxoro",     orders: 960,  drivers: 34 },
  { city: "Namangan",   orders: 1420, drivers: 52 },
  { city: "Andijon",    orders: 1180, drivers: 45 },
  { city: "Nukus",      orders: 640,  drivers: 24 },
  { city: "Farg'ona",  orders: 1040, drivers: 39 },
];

const PEAK_HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22].map(h => ({
  hour: `${h}:00`,
  orders: Math.floor(80 + Math.sin(h / 3) * 60 + Math.random() * 30),
}));

const maxOrders = Math.max(...PEAK_HOURS.map(h => h.orders));

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-slate-800">Tahlil va statistika</h2>

      {/* Peak hours */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-bold text-slate-800 mb-4">Soatlik buyurtmalar (bugun)</h3>
        <div className="flex items-end gap-1 h-32">
          {PEAK_HOURS.map(h => (
            <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-orange-400 rounded-t-sm transition-all"
                style={{ height: `${(h.orders / maxOrders) * 100}%` }}
                title={`${h.hour}: ${h.orders} ta`}
              />
              <span className="text-[9px] text-slate-400 rotate-45 origin-left">{h.hour}</span>
            </div>
          ))}
        </div>
      </div>

      {/* City breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-bold text-slate-800 mb-4">Shahar bo'yicha taqsimot</h3>
        <div className="space-y-3">
          {HEATMAP_DATA.map(c => {
            const maxO = Math.max(...HEATMAP_DATA.map(x => x.orders));
            return (
              <div key={c.city} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium text-slate-700">{c.city}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(c.orders / maxO) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold w-16 text-right">{c.orders.toLocaleString()}</span>
                <span className="text-xs text-slate-400 w-20">🚗 {c.drivers} ta</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
