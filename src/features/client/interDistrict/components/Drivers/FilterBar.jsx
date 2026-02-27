import React from "react";
import { Card, Switch, Typography } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { useDistrict } from "../../context/DistrictContext";

/**
 * FilterBar.jsx
 * -------------------------------------------------------
 * Konditsioner, yukxona kabi filterlar.
 */
export default function FilterBar() {
  const { filters, setFilters } = useDistrict();

  return (
    <Card style={{ borderRadius: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <SettingOutlined />
        <Typography.Text style={{ fontWeight: 700 }}>Filtrlar</Typography.Text>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
        <Typography.Text>Konditsioner</Typography.Text>
        <Switch checked={filters.ac} onChange={(v) => setFilters((p) => ({ ...p, ac: v }))} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
        <Typography.Text>Yukxona</Typography.Text>
        <Switch checked={filters.trunk} onChange={(v) => setFilters((p) => ({ ...p, trunk: v }))} />
      </div>
    </Card>
  );
}
