
import React from "react";
import { useMarketFilters } from "../../context/MarketFilterContext";

const chips = [
  { value: "recent", label: "Yangi" },
  { value: "price_asc", label: "Narx ↑" },
  { value: "price_desc", label: "Narx ↓" },
  { value: "year_desc", label: "Yil ↓" },
];

export default function SortChips() {
  const { filters, patchFilters } = useMarketFilters();
  return (
    <div style={{ display: "flex", gap: 8, padding: "0 12px 10px", overflowX: "auto" }}>
      {chips.map((c) => {
        const active = filters.sort === c.value;
        return (
          <button
            key={c.value}
            onClick={() => patchFilters({ sort: c.value })}
            style={{
              border: "1px solid " + (active ? "#1677ff" : "#eee"),
              background: active ? "#e6f4ff" : "white",
              color: active ? "#1677ff" : "#444",
              borderRadius: 999,
              padding: "8px 12px",
              fontWeight: 700,
              fontSize: 12,
              whiteSpace: "nowrap"
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
