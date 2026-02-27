import React from "react";
import { Card, Tag, Typography } from "antd";

/**
 * SeatLegend.jsx
 * -------------------------------------------------------
 * Ranglar ma'nosi.
 */
export default function SeatLegend() {
  return (
    <Card style={{ borderRadius: 18 }}>
      <Typography.Text style={{ fontWeight: 700 }}>Belgilash</Typography.Text>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <Tag color="green">Yashil = bo‘sh</Tag>
        <Tag color="red">Qizil = band</Tag>
      </div>
    </Card>
  );
}
