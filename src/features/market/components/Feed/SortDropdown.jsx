
import React from "react";
import { Select } from "antd";
import { useMarketFilters } from "../../context/MarketFilterContext";

export default function SortDropdown() {
  const { filters, patchFilters } = useMarketFilters();
  return (
    <Select
      value={filters.sort}
      onChange={(v) => patchFilters({ sort: v })}
      style={{ minWidth: 140 }}
      options={[
        { value: "recent", label: "Yangi" },
        { value: "price_asc", label: "Narx ↑" },
        { value: "price_desc", label: "Narx ↓" },
        { value: "year_desc", label: "Yil ↓" },
      ]}
    />
  );
}
