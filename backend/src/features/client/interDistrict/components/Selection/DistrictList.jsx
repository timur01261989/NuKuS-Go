import React, { useMemo } from "react";
import { Card, List, Typography } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { DISTRICTS } from "../../services/districtData";
import { useDistrict } from "../../context/DistrictContext";

/**
 * DistrictList.jsx
 * -------------------------------------------------------
 * Tumanlar ro'yxati. Tanlanganda toDistrict set bo‘ladi.
 */
export default function DistrictList() {
  const { toDistrict, setToDistrict } = useDistrict();

  const list = useMemo(() => DISTRICTS.filter((d) => d.name !== "Nukus"), []);

  return (
    <Card style={{ borderRadius: 18 }}>
      <Typography.Text style={{ fontWeight: 700 }}>Tuman tanlang</Typography.Text>
      <List
        itemLayout="horizontal"
        dataSource={list}
        renderItem={(d) => (
          <List.Item
            onClick={() => setToDistrict(d.name)}
            style={{
              cursor: "pointer",
              borderRadius: 12,
              padding: "10px 10px",
              background: toDistrict === d.name ? "rgba(82,196,26,.08)" : "transparent",
            }}
          >
            <List.Item.Meta
              avatar={<EnvironmentOutlined style={{ fontSize: 18, color: "#1677ff" }} />}
              title={<span style={{ fontWeight: 700 }}>{d.name}</span>}
              description={<span style={{ color: "#666" }}>Tuman markazi</span>}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
