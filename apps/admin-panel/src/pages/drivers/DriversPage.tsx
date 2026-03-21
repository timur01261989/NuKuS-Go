import React, { useState } from "react";
import DataTable from "../../components/DataTable";

const MOCK_DRIVERS = Array.from({ length: 30 }, (_, i) => ({
  id:      `DRV-${500 + i}`,
  name:    ["Alisher Yusupov", "Davron Mirzaev", "Sanjar Tursunov", "Ulugbek Razzaqov"][i % 4],
  phone:   `+998 91 ${300 + i} ${40 + i % 9} ${10 + i % 7}`,
  plate:   `0${i % 3 + 1} ${String.fromCharCode(65 + i % 5)} ${100 + i} BC`,
  status:  ["online", "offline", "on_trip"][i % 3],
  rating:  (4.3 + (i % 7) / 10).toFixed(1),
  trips:   Math.floor(Math.random() * 500 + 100),
  revenue: `${(Math.floor(Math.random() * 5) + 2)}M`,
}));

const STATUS = {
  online:   "bg-green-100 text-green-700",
  offline:  "bg-slate-100 text-slate-500",
  on_trip:  "bg-blue-100 text-blue-700",
};

export default function DriversPage() {
  const [filter, setFilter] = useState("all");
  const data = filter === "all" ? MOCK_DRIVERS : MOCK_DRIVERS.filter(d => d.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800">Haydovchilar</h2>
        <div className="flex gap-2">
          {["all","online","offline","on_trip"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === s ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {s === "all" ? "Barchasi" : s}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        data={data}
        columns={[
          { key: "id",      label: "ID" },
          { key: "name",    label: "Ism" },
          { key: "phone",   label: "Telefon" },
          { key: "plate",   label: "Davlat raqami" },
          { key: "status",  label: "Holat", render: v => <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${(STATUS as any)[v]}`}>{v}</span> },
          { key: "rating",  label: "Reyting" },
          { key: "trips",   label: "Sayohatlar" },
          { key: "revenue", label: "Daromad" },
        ]}
      />
    </div>
  );
}
