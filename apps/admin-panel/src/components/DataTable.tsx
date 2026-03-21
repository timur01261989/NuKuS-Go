import React, { useState } from "react";

interface Column<T> { key: keyof T; label: string; render?: (v: any, row: T) => React.ReactNode; }
interface Props<T>  { columns: Column<T>[]; data: T[]; loading?: boolean; pageSize?: number; }

export default function DataTable<T extends Record<string, any>>({ columns, data, loading, pageSize = 20 }: Props<T>) {
  const [page, setPage] = useState(1);
  const total  = data.length;
  const pages  = Math.ceil(total / pageSize);
  const sliced = data.slice((page - 1) * pageSize, page * pageSize);

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>{columns.map(c => <th key={String(c.key)} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sliced.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition">
                {columns.map(c => (
                  <td key={String(c.key)} className="px-4 py-3 text-slate-700">
                    {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {!sliced.length && (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">Ma'lumot topilmadi</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-slate-500">Jami {total} ta</span>
          <div className="flex gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${p === page ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
