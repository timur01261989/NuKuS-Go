import React from "react";

interface Props { title: string; value: string | number; icon: string; trend?: number; color?: string; }

export default function StatCard({ title, value, icon, trend, color = "orange" }: Props) {
  const colors: Record<string, string> = {
    orange: "bg-orange-50 text-orange-600",
    green:  "bg-green-50 text-green-600",
    blue:   "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${colors[color]}`}>{icon}</span>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-slate-800 mb-1">{typeof value === "number" ? value.toLocaleString("ru-RU") : value}</div>
      <div className="text-sm text-slate-500 font-medium">{title}</div>
    </div>
  );
}
