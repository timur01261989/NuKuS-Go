import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/users",     icon: "👥", label: "Foydalanuvchilar" },
  { to: "/drivers",   icon: "🚗", label: "Haydovchilar" },
  { to: "/orders",    icon: "📦", label: "Buyurtmalar" },
  { to: "/finance",   icon: "💳", label: "Moliya" },
  { to: "/analytics", icon: "📈", label: "Tahlil" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-16" : "w-60"} flex flex-col bg-slate-900 text-white transition-all duration-200 flex-shrink-0`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
          {!collapsed && <span className="text-xl font-black text-orange-400">UniGo Admin</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-slate-400 hover:text-white">
            {collapsed ? "›" : "‹"}
          </button>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive ? "bg-orange-500 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span className="text-lg">{n.icon}</span>
              {!collapsed && <span>{n.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-700 text-xs text-slate-500">
          {!collapsed && "UniGo v2.0 Admin"}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
          <h1 className="text-lg font-bold text-slate-800">Boshqaruv paneli</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{new Date().toLocaleDateString("uz-UZ")}</span>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">A</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
