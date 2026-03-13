import React from "react";
import { Select } from "antd";
import { useMarket } from "../../context/MarketContext";
import { useAutoMarketI18n } from "../../utils/useAutoMarketI18n";

export default function SortDropdown() {
  const { am } = useAutoMarketI18n();
  const { filters, patchFilters } = useMarket();
  return (
    <Select
      value={filters.sort}
      onChange={(v) => patchFilters({ sort: v })}
      style={{ width: 160 }}
      options={[
        { value: "recent", label: am("sort.recent") },
        { value: "cheap", label: am("sort.cheap") },
        { value: "expensive", label: am("sort.expensive") },
        { value: "year_new", label: am("sort.yearNew") },
      ]}
    />
  );
}
