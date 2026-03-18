import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Empty, List, Segmented, Space, Steps, Tag, Typography, message } from "antd";
import { CheckCircleOutlined, PhoneOutlined } from "@ant-design/icons";

import { useAuth } from "@/modules/shared/auth/AuthProvider";
import { listDriverDeliveryOrders, driverUpdateDeliveryStatusApi } from '@/services/deliveryApi.js';
import { getDeliveryStatusSteps } from "@/modules/client/features/client/delivery/services/deliveryConfig.js";
import { useDriverText } from "../../shared/i18n_driverLocalize";
import { fetchDriverCapability, canDriverSeeOrder } from "../../core/driverCapabilityService";

const { Title, Text } = Typography;

function ActionCard({ order, onAction, cp }) {
  const steps = getDeliveryStatusSteps(order.status);
  const nextAction =
    order.status === "searching" || order.status === "pending"
      ? { key: "accept", label: cp("Qabul qilish") }
      : order.status === "accepted"
      ? { key: "picked_up", label: cp("Buyumni oldim") }
      : order.status === "picked_up"
      ? { key: "delivered", label: cp("Topshirildi") }
      : null;

  return (
    <Card style={{ borderRadius: 18, width: "100%" }} styles={{ body: { padding: 14 } }}>
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
          <Tag color={order.pickup_mode === "precise" ? "gold" : "default"}>Pickup: {order.pickup_mode === "precise" ? cp("aniq") : cp("standart")}</Tag>
          <Tag color={order.dropoff_mode === "precise" ? "purple" : "default"}>Dropoff: {order.dropoff_mode === "precise" ? cp("aniq") : cp("standart")}</Tag>
          {order.matched_trip_title ? <Tag color="blue">{cp("Reys:")} {order.matched_trip_title}</Tag> : null}
        </Space>

        <div>
          <div><b>{cp("Olash joyi:")}</b> {order.pickup_label}</div>
          <div><b>{cp("Topshirish joyi:")}</b> {order.dropoff_label}</div>
          <div><b>{cp("Qabul qiluvchi:")}</b> {order.receiver_name} — {order.receiver_phone}</div>
          <div><b>{cp("Jo‘natuvchi:")}</b> {order.sender_phone}</div>
          {order.comment ? <div><b>{cp("Izoh:")}</b> {order.comment}</div> : null}
        </div>

        <Steps current={Math.max(0, steps.findIndex((item) => item.key === order.status))} items={steps.map((item) => ({ title: item.label }))} size="small" responsive />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {nextAction ? (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => onAction(order, nextAction.key)}>
              {nextAction.label}
            </Button>
          ) : null}
          <Button href={`tel:${order.receiver_phone}`} icon={<PhoneOutlined />}>{cp("Qabul qiluvchiga qo‘ng‘iroq")}</Button>
        </div>
      </Space>
    </Card>
  );
}

export default function DriverDelivery() {
  const { cp } = useDriverText();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [serviceMode, setServiceMode] = useState("all");
  const [capability, setCapability] = useState(null);

  const loadOrders = useCallback(async () => {
    const currentCapability = await fetchDriverCapability(user?.id || null);
    setCapability(currentCapability);

    const response = await listDriverDeliveryOrders();
    const openOrders = (response.orders || []).filter((item) => {
      const assignedToCurrentDriver = item.matched_driver_user_id === user?.id || item.driver_user_id === user?.id;
      if (assignedToCurrentDriver) return item.status !== "delivered";
      return item.status === "searching" || item.status === "pending";
    });

    const filteredByCapability = openOrders.filter((item) =>
      canDriverSeeOrder(currentCapability, {
        serviceArea: item.service_mode === "region" ? "intercity" : item.service_mode === "district" ? "interdistrict" : "city",
        orderType: "delivery",
        weightKg: item.weight_kg || 0,
        volumeM3: item.volume_m3 || 0,
      })
    );

    setOrders(filteredByCapability);
  }, [user?.id]);

  useEffect(() => {
    loadOrders().catch((error) => {
      message.error(error?.message || cp("Eltish buyurtmalarini yuklashda xato"));
    });
  }, [loadOrders, cp]);

  const filtered = useMemo(() => {
    let items = orders.filter((item) => item.status !== "delivered");
    if (serviceMode !== "all") items = items.filter((item) => item.service_mode === serviceMode);
    return items;
  }, [orders, serviceMode]);

  const handleAction = async (order, action) => {
    const patch = { updated_at: new Date().toISOString() };
    const history = Array.isArray(order.history) ? [...order.history] : [];

    if (action === "accept") {
      patch.status = "accepted";
      patch.matched_driver_user_id = user?.id || order.matched_driver_user_id || null;
      patch.driver_user_id = user?.id || order.driver_user_id || null;
      patch.matched_driver_name = user?.phone || user?.email || cp("Haydovchi");
      history.push({ id: `evt_${Date.now()}`, type: "accepted", at: patch.updated_at, by: patch.matched_driver_name });
    }
    if (action === "picked_up") {
      patch.status = "picked_up";
      history.push({ id: `evt_${Date.now()}`, type: "picked_up", at: patch.updated_at });
    }
    if (action === "delivered") {
      patch.status = "delivered";
      history.push({ id: `evt_${Date.now()}`, type: "delivered", at: patch.updated_at });
    }

    patch.history = history;

    await driverUpdateDeliveryStatusApi({
      id: order.id,
      status: patch.status,
      patch,
      history,
      driverName: patch.matched_driver_name || user?.phone || user?.email || cp('Haydovchi'),
    });

    message.success(cp("Eltish holati yangilandi"));
    await loadOrders();
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 16, paddingBottom: 90 }}>
      <Card style={{ borderRadius: 18, marginBottom: 14 }} styles={{ body: { padding: 16 } }}>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Title level={4} style={{ margin: 0 }}>{cp("Haydovchi — Eltish paneli")}</Title>
          <Text type="secondary">{cp("Shahar, tumanlar aro va viloyatlar aro eltish buyurtmalarini shu yerdan qabul qilasiz.")} {capability?.activeVehicle ? `${capability.activeVehicle.maxWeightKg}kg / ${capability.activeVehicle.maxVolumeM3}m³` : cp("Aktiv mashina tanlanmagan")}</Text>
          <Segmented
            value={serviceMode}
            onChange={setServiceMode}
            options={[
              { value: "all", label: cp("Hammasi") },
              { value: "city", label: cp("Shahar") },
              { value: "district", label: cp("Tumanlar aro") },
              { value: "region", label: cp("Viloyatlar aro") },
            ]}
          />
        </Space>
      </Card>

      {filtered.length === 0 ? (
        <Card style={{ borderRadius: 18 }}><Empty description={cp("Hozircha eltish buyurtmalari yo‘q")} /></Card>
      ) : (
        <List
          dataSource={filtered}
          renderItem={(order) => (
            <List.Item style={{ padding: 0, border: 0, marginBottom: 12 }}>
              <ActionCard order={order} onAction={handleAction} cp={cp} />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
