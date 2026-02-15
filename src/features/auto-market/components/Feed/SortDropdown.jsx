import React from "react";
import { Select } from "antd";
import { useMarket } from "../../context/MarketContext";

export default function SortDropdown() {
  const { filters, patchFilters } = useMarket();
  return (
    <Select
      value={filters.sort}
      onChange={(v) => patchFilters({ sort: v })}
      style={{ width: 160 }}
      options={[
        { value: "recent", label: "Yangi" },
        { value: "cheap", label: "Arzon" },
        { value: "expensive", label: "Qimmat" },
        { value: "year_new", label: "Yili yangi" },
      ]}
    />
  );
}
