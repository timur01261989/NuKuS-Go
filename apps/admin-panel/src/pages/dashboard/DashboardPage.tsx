import React from "react";
import StatCard from "../../components/StatCard";

const STATS = [
  { title: "Bugungi buyurtmalar", value: 1842,   icon: "📦", trend: 12,  color: "orange" },
  { title: "Aktiv haydovchilar",  value: 347,    icon: "🚗", trend: 5,   color: "green"  },
  { title: "Daromad (so'm)",     value: "8.4M", icon: "💰", trend: 18,  color: "blue"   },
  { title: "Yangi foydalanuvchi", value: 213,    icon: "👤", trend: -3,  color: "purple" },
];

const RECENT_ORDERS = [
  { id: "#12845", user: "Jasur T.",    service: "Taksi",     status: "Bajarildi",    price: "18 000" },
  { id: "#12844", user: "Malika R.",   service: "Yetkazish", status: "Yo'lda",      price: "12 000" },
  { id: "#12843", user: "Sherzod N.",  service: "Yuk",       status: "Qidirilmoqda", price: "45 000" },
  { id: "#12842", user: "Nodira K.",   service: "Taksi",     status: "Bajarildi",    price: "22 000" },
];

const STATUS_COLORS: Record<string, string> = {
  "Bajarildi":    "bg-green-100 text-green-700",
  "Yo'lda":       "bg-blue-100 text-blue-700",
  "Qidirilmoqda": "bg-yellow-100 text-yellow-700",
  "Bekor":        "bg-red-100 text-red-600",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-slate-800">Umumiy ko'rsatkichlar</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => <StatCard key={s.title} {...s as any} />)}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-bold text-slate-800 mb-4">Oxirgi buyurtmalar</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-slate-400 uppercase">
            <th className="text-left py-2">ID</th>
            <th className="text-left py-2">Mijoz</th>
            <th className="text-left py-2">Xizmat</th>
            <th className="text-left py-2">Holat</th>
            <th className="text-right py-2">Narx</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {RECENT_ORDERS.map(o => (
              <tr key={o.id} className="hover:bg-slate-50/50">
                <td className="py-3 font-mono text-orange-500">{o.id}</td>
                <td className="py-3 text-slate-700">{o.user}</td>
                <td className="py-3 text-slate-500">{o.service}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[o.status] || "bg-slate-100"}`}>{o.status}</span>
                </td>
                <td className="py-3 text-right font-semibold">{o.price} so'm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
