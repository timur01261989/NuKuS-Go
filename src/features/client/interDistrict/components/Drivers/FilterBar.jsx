import React from "react";
import { Card, Space, Switch, Typography } from "antd";
import { useDistrict } from "../../context/DistrictContext";

export default function FilterBar() {
  const { filters, setFilters } = useDistrict();

  const handleChange = (key, checked) => {
    setFilters((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <Card
      bodyStyle={{ padding: "16px 12px" }}
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        border: "none",
      }}
    >
      <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
        Qo'shimcha qulayliklar
      </Typography.Title>
      
      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        {/* Konditsioner filtri */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography.Text>Konditsioner</Typography.Text>
          <Switch
            checked={filters.ac}
            onChange={(checked) => handleChange("ac", checked)}
          />
        </div>

        {/* Yukxona filtri */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography.Text>Katta yukxona (Bagaj)</Typography.Text>
          <Switch
            checked={filters.trunk}
            onChange={(checked) => handleChange("trunk", checked)}
          />
        </div>
      </Space>
    </Card>
  );
}