import React, { useState } from "react";
import DataTable from "../../components/DataTable";

const SERVICES = ["taxi", "delivery", "freight", "intercity", "food"];
const STATUSES  = ["searching", "accepted", "in_progress", "completed", "cancelled"];

const MOCK_ORDERS = Array.from({ length: 80 }, (_, i) => ({
  id:       `#${12000 + i}`,
  service:  SERVICES[i % SERVICES.length],
  user:     `Foydalanuvchi ${i + 1}`,
  driver:   i % 5 === 0 ? "-" : `Haydovchi ${i % 20 + 1}`,
  status:   STATUSES[i % STATUSES.length],
  price:    `${(Math.floor(Math.random() * 50) + 10) * 1000}`,
  created:  `2024-03-${(i % 28) + 1} ${(i % 24).toString().padStart(2, "0")}:${(i % 60).toString().padStart(2, "0")}`,
}));

const STATUS_COLORS: Record<string, string> = {
  completed:   "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  accepted:    "bg-yellow-100 text-yellow-700",
  searching:   "bg-orange-100 text-orange-600",
  cancelled:   "bg-red-100 text-red-600",
};

export default function OrdersPage() {
  const [service, setService] = useState("all");
  const data = service === "all" ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.service === service);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-slate-800">Buyurtmalar</h2>
      <div className="flex gap-2 flex-wrap">
        {["all", ...SERVICES].map(s => (
          <button key={s} onClick={() => setService(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${service === s ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600"}`}>
            {s === "all" ? "Barchasi" : s}
          </button>
        ))}
      </div>
      <DataTable
        data={data}
        columns={[
          { key: "id",      label: "ID" },
          { key: "service", label: "Xizmat", render: v => <span className="capitalize font-medium">{v}</span> },
          { key: "user",    label: "Mijoz" },
          { key: "driver",  label: "Haydovchi" },
          { key: "status",  label: "Holat", render: v => <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[v] || "bg-slate-100"}`}>{v}</span> },
          { key: "price",   label: "Narx (so'm)", render: v => `${Number(v).toLocaleString("ru-RU")} so'm` },
          { key: "created", label: "Vaqt" },
        ]}
      />
    </div>
  );
}
