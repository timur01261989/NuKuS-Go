import React from "react";
import {
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  List,
  Modal,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { mapAssets } from "@/assets/map";
import { orderAssets } from "@/assets/order";

import "leaflet/dist/leaflet.css";

const { Text } = Typography;

const pickupMapMarker = L.icon({
  iconUrl: mapAssets.pickupPin || mapAssets.clientPinDay || mapAssets.pickupPointLive || mapAssets.pickupPoint || mapAssets.routePointLive || mapAssets.routePoint,
  iconSize: [42, 52],
  iconAnchor: [21, 46],
});

const dropoffMapMarker = L.icon({
  iconUrl: mapAssets.finishPin || mapAssets.dropoffPin || mapAssets.deliveryPointLive || mapAssets.deliveryPoint || mapAssets.routePointLive || mapAssets.routePoint,
  iconSize: [42, 52],
  iconAnchor: [21, 46],
});


export function clampUzPhoneDigits(value = "") {
  return String(value).replace(/\D/g, "").slice(0, 9);
}

export function formatUzPhoneLabel(value = "") {
  const digits = clampUzPhoneDigits(value);
  if (!digits) return "";
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 5);
  const p3 = digits.slice(5, 7);
  const p4 = digits.slice(7, 9);
  return [p1, p2, p3, p4].filter(Boolean).join(" ");
}

export async function reverseGeocode(point) {
  if (!Array.isArray(point) || point.length < 2) return "";
  try {
    const [lat, lon] = point;
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=uz`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error("Reverse geocode failed");
    const data = await res.json();
    return (
      data?.display_name ||
      [
        data?.address?.road,
        data?.address?.suburb,
        data?.address?.city || data?.address?.town || data?.address?.village,
        data?.address?.state,
      ]
        .filter(Boolean)
        .join(", ")
    );
  } catch {
    return "";
  }
}

export function MapPickerEvents({ onPick }) {
  useMapEvents({
    click(e) {
      onPick?.([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export function PhoneField({ value, onChange, placeholder = "90 123 45 67", onSelectContact }) {
  return (
    <Input
      value={formatUzPhoneLabel(value)}
      placeholder={placeholder}
      addonBefore={<span>+998</span>}
      addonAfter={
        onSelectContact ? (
          <Button type="link" size="small" onClick={onSelectContact}>
            Kontakt
          </Button>
        ) : null
      }
      onChange={(event) => onChange?.(clampUzPhoneDigits(event?.target?.value))}
    />
  );
}

export function ContactPickerModal({ open, onClose, contacts, onPick, loading }) {
  return (
    <Modal title="Kontakt tanlash" open={open} onCancel={onClose} footer={null}>
      <List
        loading={loading}
        locale={{ emptyText: <Empty description="Kontaktlar topilmadi" /> }}
        dataSource={contacts}
        renderItem={(contact) => (
          <List.Item onClick={() => onPick?.(contact)} style={{ cursor: "pointer" }}>
            <List.Item.Meta
              avatar={<UserOutlined />}
              title={contact?.name || "Kontakt"}
              description={contact?.phone ? `+998 ${formatUzPhoneLabel(contact.phone)}` : "Telefon yo'q"}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}

export function LocationPickerDrawer({
  open,
  title,
  point,
  onClose,
  onConfirm,
  label,
}) {
  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      placement="bottom"
      height={520}
      extra={
        <Button type="primary" onClick={() => onConfirm?.(point)}>
          Tanlash
        </Button>
      }
    >
      <MapContainer center={point || [41.31, 69.24]} zoom={13} style={{ height: 360, borderRadius: 16 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapPickerEvents onPick={onConfirm} />
        {Array.isArray(point) && point.length === 2 ? <Marker position={point} icon={String(title || "").toLowerCase().includes("olish") ? pickupMapMarker : dropoffMapMarker} /> : null}
      </MapContainer>
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">{label || "Xaritadan nuqtani belgilang"}</Text>
      </div>
    </Drawer>
  );
}

export function ServiceInfoCard({ serviceMode, pickupMode, dropoffMode, matchedTripTitle }) {
  const modeItems = [
    { key: "service", label: "Xizmat rejimi", value: serviceMode, icon: orderAssets.orderDelivery || orderAssets.orderTruck },
    { key: "pickup", label: "Olish usuli", value: pickupMode, icon: orderAssets.orderBoxPoint || orderAssets.orderBoxOpen },
    { key: "dropoff", label: "Topshirish usuli", value: dropoffMode, icon: orderAssets.orderClientPoint || orderAssets.orderDelivery },
  ];
  return (
    <Card size="small" bordered={false} style={{ borderRadius: 18 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Text strong>Xizmat rejimi</Text>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {modeItems.map((item) => (
            <div
              key={item.key}
              style={{
                borderRadius: 16,
                padding: 12,
                background: "linear-gradient(180deg, rgba(22,119,255,.08) 0%, rgba(22,119,255,.03) 100%)",
                border: "1px solid rgba(22,119,255,.12)",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <img src={item.icon} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
              <div>
                <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)" }}>{item.label}</div>
                <div style={{ fontWeight: 800 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
        {matchedTripTitle ? (
          <Tag color="green" style={{ alignSelf: "flex-start", borderRadius: 999 }}>
            {matchedTripTitle}
          </Tag>
        ) : null}
      </Space>
    </Card>
  );
}

export function OrderCard({ order, onEdit, onDelete }) {
  const statusTone = String(order?.status || "").toLowerCase();
  const statusIcon = statusTone === "completed"
    ? (orderAssets.orderCheck || orderAssets.orderReceipt)
    : statusTone === "cancelled"
      ? (orderAssets.orderCross || orderAssets.orderWarning)
      : (orderAssets.orderSchedule || orderAssets.orderProgressPin);

  return (
    <Card
      hoverable
      style={{ borderRadius: 22 }}
      actions={[
        <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => onEdit?.(order)}>
          Tahrirlash
        </Button>,
        <Button key="delete" danger type="text" icon={<DeleteOutlined />} onClick={() => onDelete?.(order)}>
          O'chirish
        </Button>,
      ]}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <Space align="center" size={10}>
            <img src={orderAssets.orderDeliveryCar || orderAssets.orderDelivery} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
            <div>
              <Text strong>Buyurtma</Text>
              <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)" }}>{order?.parcel_type || "delivery"}</div>
            </div>
          </Space>
          <Tag color="blue" style={{ borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <img src={statusIcon} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />
            {order?.status || "draft"}
          </Tag>
        </div>
        <Space align="start">
          <EnvironmentOutlined />
          <div>
            <Text strong>Olish manzili</Text>
            <div>{order?.pickup_address || "Ko'rsatilmagan"}</div>
          </div>
        </Space>
        <Space align="start">
          <PhoneOutlined />
          <div>
            <Text strong>Qabul qiluvchi</Text>
            <div>{order?.receiver_name || "Ko'rsatilmagan"}</div>
            <div>{order?.receiver_phone ? `+998 ${formatUzPhoneLabel(order.receiver_phone)}` : "Telefon yo'q"}</div>
          </div>
        </Space>
      </Space>
    </Card>
  );
}

export const pageBg = "linear-gradient(180deg, #edf3ff 0%, #f7faff 48%, #ffffff 100%)";
export const cardBg = "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)";
