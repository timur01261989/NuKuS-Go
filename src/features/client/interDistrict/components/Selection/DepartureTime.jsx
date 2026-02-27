import React from "react";
import { Card, Segmented, Typography } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { useDistrict } from "../../context/DistrictContext";

/**
 * DepartureTime.jsx
 * -------------------------------------------------------
 * Ketish vaqti: hozir / 1 soatdan keyin / 2 soatdan keyin
 */
export default function DepartureTime() {
  const { departureTime, setDepartureTime } = useDistrict();

  return (
    <Card style={{ borderRadius: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <ClockCircleOutlined />
        <Typography.Text style={{ fontWeight: 700 }}>Ketish vaqti</Typography.Text>
      </div>

      <Segmented
        value={departureTime}
        onChange={(v) => setDepartureTime(v)}
        options={[
          { label: "Hozir", value: "now" },
          { label: "1 soatdan keyin", value: "1h" },
          { label: "2 soatdan keyin", value: "2h" },
        ]}
        block
      />
    </Card>
  );
}
