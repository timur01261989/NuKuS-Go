import React from "react";
import { Card, Empty, List, Typography } from "antd";
import { OrderCard } from "../DeliveryPage.helpers";

const { Title } = Typography;

export default function DeliveryOrdersSection({ cp, orders, handleEdit, handleDelete, telemetryMeta = null }) {
  return (
    <div style={{ marginTop: 18 }}>
      <Title level={5} style={{ marginBottom: 8 }}>{cp("Mening eltish buyurtmalarim")}</Title>
      {telemetryMeta?.state ? <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>{cp("Kuzatuv holati")}: {telemetryMeta.state}{telemetryMeta.paused ? ` • ${cp("pauza")}` : ""}</div> : null}
      {orders.length === 0 ? (
        <Card style={{ borderRadius: 18 }}><Empty description={cp("Hozircha eltish buyurtmasi yo‘q")} /></Card>
      ) : (
        <List
          dataSource={orders}
          renderItem={(item) => (
            <List.Item style={{ padding: 0, border: 0 }}>
              <OrderCard order={item} onEdit={handleEdit} onDelete={handleDelete} />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}