import React from "react";
import { Card, List, Tag, Button, Space } from "antd";
import { EnvironmentOutlined, DollarOutlined } from "@ant-design/icons";

export default function UnifiedOrdersFeed({ orders, onBid, compact = false }) {
  const data = Array.isArray(orders) ? orders : [];

  return (
    <Card
      size="small"
      style={{ borderRadius: 16 }}
      styles={{ body: { padding: compact ? 10 : 16 } }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <div style={{ fontWeight: 800 }}>Mos buyurtmalar</div>
        <Tag color="green" style={{ margin: 0 }}>{data.length} ta</Tag>
      </div>

      <List
        dataSource={data}
        locale={{ emptyText: "Hozircha yuk yo'q" }}
        renderItem={(o) => (
          <List.Item
            style={{ paddingLeft: 0, paddingRight: 0 }}
            actions={[
              <Button key="bid" type="primary" size="small" onClick={() => onBid?.(o)}>
                Taklif
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space size={8} wrap>
                  <span style={{ fontWeight: 700 }}>{o.title || o.cargo || "Yuk"}</span>
                  {o.weight_tons ? <Tag color="blue">{o.weight_tons}t</Tag> : null}
                  {o.status ? <Tag>{o.status}</Tag> : null}
                </Space>
              }
              description={
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "#555" }}>
                  <span><EnvironmentOutlined /> {o.from?.city || o.from_address || "A"}</span>
                  <span>→</span>
                  <span><EnvironmentOutlined /> {o.to?.city || o.to_address || "B"}</span>
                  <span><DollarOutlined /> {o.budget ? `${o.budget}` : "Kelishiladi"}</span>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
