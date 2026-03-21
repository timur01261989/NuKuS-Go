import React, { useState } from "react";
import DataTable from "../../components/DataTable";

const MOCK_USERS = Array.from({ length: 50 }, (_, i) => ({
  id:        `USR-${1000 + i}`,
  name:      ["Jasur Toshmatov", "Malika Rahimova", "Sherzod Nazarov", "Nodira Karimova", "Bobur Xasanov"][i % 5],
  phone:     `+998 9${i % 4} ${100 + i} ${10 + i % 9} ${30 + i % 7}`,
  role:      i % 8 === 0 ? "driver" : "client",
  status:    i % 10 === 0 ? "banned" : "active",
  orders:    Math.floor(Math.random() * 50),
  joined:    `2024-0${(i % 9) + 1}-${(i % 28) + 1}`,
}));

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800">Foydalanuvchilar</h2>
        <span className="text-sm text-slate-500">Jami: {MOCK_USERS.length}</span>
      </div>
      <input
        className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-400"
        placeholder="Ism yoki telefon qidirish..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <DataTable
        data={filtered}
        columns={[
          { key: "id",     label: "ID" },
          { key: "name",   label: "Ism" },
          { key: "phone",  label: "Telefon" },
          { key: "role",   label: "Rol", render: v => <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${v === "driver" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{v}</span> },
          { key: "status", label: "Holat", render: v => <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${v === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{v}</span> },
          { key: "orders", label: "Buyurtmalar" },
          { key: "joined", label: "Ro'yxatdan" },
        ]}
      />
    </div>
  );
}
