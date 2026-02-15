
import React, { useMemo } from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useMarketFilters } from "../../context/MarketFilterContext";

export default function SearchBar({ placeholder = "Qidirish..." }) {
  const { filters, patchFilters } = useMarketFilters();
  const value = useMemo(() => filters.q || "", [filters.q]);

  return (
    <div style={{ padding: 12 }}>
      <Input
        size="large"
        allowClear
        value={value}
        onChange={(e) => patchFilters({ q: e.target.value })}
        prefix={<SearchOutlined style={{ color: "#999" }} />}
        placeholder={placeholder}
        style={{ borderRadius: 14 }}
      />
    </div>
  );
}
