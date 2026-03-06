import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Empty, List, Segmented, Space, Steps, Tag, Typography, message } from "antd";
import { CheckCircleOutlined, PhoneOutlined } from "@ant-design/icons";

import { useAuth } from "@/shared/auth/AuthProvider";
import { getDeliveryStatusSteps } from "@/features/client/delivery/services/deliveryConfig";
import { appendDeliveryHistory, listDeliveryOrders, updateDeliveryOrder } from "@/features/client/delivery/services/deliveryStore";

const { Title, Text } = Typography;

function ActionCard({ order, onAction }) {
  const steps = getDeliveryStatusSteps(order.status);
  const nextAction =
    order.status === "searching"
      ? { key: "accept", label: "Qabul qilish" }
      : order.status === "accepted"
      ? { key: "picked_up", label: "Buyumni oldim" }
      : order.status === "picked_up"
      ? { key: "delivered", label: "Topshirildi" }
      : null;

  return (
    <Card style={{ borderRadius: 18, width: "100%" }} bodyStyle={{ padding: 14 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800 }}>{order.parcel_label}</div>
            <Text type="secondary">{order.pickup_region} {order.pickup_district ? `• ${order.pickup_district}` : ""} → {order.dropoff_region} {order.dropoff_district ? `• ${order.dropoff_district}` : ""}</Text>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800 }}>{Number(order.price || 0).toLocaleString("uz-UZ")} so‘m</div>
            <Text type="secondary">{order.service_mode}</Text>
          </div>
        </div>

        <Space wrap>
          <Tag color={order.pickup_mode === "precise" ? "gold" : "default"}>Pickup: {order.pickup_mode === "precise" ? "aniq" : "standart"}</Tag>
          <Tag color={order.dropoff_mode === "precise" ? "purple" : "default"}>Dropoff: {order.dropoff_mode === "precise" ? "aniq" : "standart"}</Tag>
          {order.matched_trip_title ? <Tag color="blue">Reys: {order.matched_trip_title}</Tag> : null}
        </Space>

        <div>
          <div><b>Olash joyi:</b> {order.pickup_label}</div>
          <div><b>Topshirish joyi:</b> {order.dropoff_label}</div>
          <div><b>Qabul qiluvchi:</b> {order.receiver_name} — {order.receiver_phone}</div>
          <div><b>Jo‘natuvchi:</b> {order.sender_phone}</div>
          {order.comment ? <div><b>Izoh:</b> {order.comment}</div> : null}
        </div>

        <Steps current={Math.max(0, steps.findIndex((item) => item.key === order.status))} items={steps.map((item) => ({ title: item.label }))} size="small" responsive />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {nextAction ? (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => onAction(order, nextAction.key)}>
              {nextAction.label}
            </Button>
          ) : null}
          <Button href={`tel:${order.receiver_phone}`} icon={<PhoneOutlined />}>Qabul qiluvchiga qo‘ng‘iroq</Button>
        </div>
      </Space>
    </Card>
  );
}

export default function DriverDelivery() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [serviceMode, setServiceMode] = useState("all");

  const loadOrders = async () => {
    setOrders(await listDeliveryOrders());
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = useMemo(() => {
    let items = orders.filter((item) => item.status !== "delivered");
    if (serviceMode !== "all") items = items.filter((item) => item.service_mode === serviceMode);
    return items;
  }, [orders, serviceMode]);

  const handleAction = async (order, action) => {
    const patch = {};
    if (action === "accept") {
      patch.status = "accepted";
      patch.matched_driver_id = user?.id || order.matched_driver_id || null;
      patch.matched_driver_name = user?.phone || user?.email || "Haydovchi";
      await appendDeliveryHistory(order.id, { type: "accepted", by: patch.matched_driver_name });
    }
    if (action === "picked_up") {
      patch.status = "picked_up";
      await appendDeliveryHistory(order.id, { type: "picked_up" });
    }
    if (action === "delivered") {
      patch.status = "delivered";
      await appendDeliveryHistory(order.id, { type: "delivered" });
    }
    await updateDeliveryOrder(order.id, patch);
    message.success("Eltish holati yangilandi");
    loadOrders();
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 16, paddingBottom: 90 }}>
      <Card style={{ borderRadius: 18, marginBottom: 14 }} bodyStyle={{ padding: 16 }}>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Title level={4} style={{ margin: 0 }}>Haydovchi — Eltish paneli</Title>
          <Text type="secondary">Shahar, tumanlar aro va viloyatlar aro eltish buyurtmalarini shu yerdan qabul qilasiz.</Text>
          <Segmented
            value={serviceMode}
            onChange={setServiceMode}
            options={[
              { value: "all", label: "Hammasi" },
              { value: "city", label: "Shahar" },
              { value: "district", label: "Tumanlar aro" },
              { value: "region", label: "Viloyatlar aro" },
            ]}
          />
        </Space>
      </Card>

      {filtered.length === 0 ? (
        <Card style={{ borderRadius: 18 }}><Empty description="Hozircha eltish buyurtmalari yo‘q" /></Card>
      ) : (
        <List
          dataSource={filtered}
          renderItem={(order) => (
            <List.Item style={{ padding: 0, border: 0, marginBottom: 12 }}>
              <ActionCard order={order} onAction={handleAction} />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
