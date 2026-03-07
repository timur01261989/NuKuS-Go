import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Radio,
  Segmented,
  Space,
  Steps,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

import { useAuth } from "@/shared/auth/AuthProvider";
import { useLanguage } from "@/shared/i18n/useLanguage";
import RegionDistrictSelect from "@/shared/components/RegionDistrictSelect";
import { useContacts } from "./hooks/useContacts";
import {
  DELIVERY_SERVICE_MODES,
  PARCEL_TYPES,
  calculateDeliveryPrice,
  getDeliveryStatusSteps,
  getParcelMeta,
  getRegionCenterByName,
  getStandardPointLabel,
} from "./services/deliveryConfig";
import {
  calcDeliveryCommission,
  createDeliveryOrder,
  deleteDeliveryOrder,
  listDeliveryOrders,
  listOpenIntercityTrips,
  updateDeliveryOrder,
} from "./services/deliveryStore";

import "leaflet/dist/leaflet.css";

const { Title, Text } = Typography;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function clampUzPhoneDigits(value = "") {
  return String(value).replace(/\D/g, "").slice(0, 9);
}

function formatUzPhoneLabel(value = "") {
  const digits = clampUzPhoneDigits(value);
  if (!digits) return "";
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 5);
  const p3 = digits.slice(5, 7);
  const p4 = digits.slice(7, 9);
  return [p1, p2, p3, p4].filter(Boolean).join(" ");
}

async function reverseGeocode(point) {
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

function MapPickerEvents({ onPick }) {
  useMapEvents({
    click(e) {
      onPick?.([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function PhoneField({ value, onChange, placeholder = "90 123 45 67", onSelectContact }) {
  const { t } = useLanguage();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "92px 1fr auto", gap: 8 }}>
      <Input value="+998" disabled style={{ textAlign: "center", fontWeight: 800 }} />
      <Input
        value={formatUzPhoneLabel(value)}
        onChange={(e) => onChange?.(clampUzPhoneDigits(e.target.value))}
        placeholder={placeholder}
        inputMode="numeric"
        maxLength={12}
        prefix={<PhoneOutlined />}
      />
      <Button icon={<UserOutlined />} onClick={onSelectContact}>{t.contact}</Button>
    </div>
  );
}

function ContactPickerModal({ open, onClose, contacts, onPick, loading }) {
  const { t } = useLanguage();
  return (
    <Modal title={t.contactSelect} open={open} footer={null} onCancel={onClose}>
      <List
        loading={loading}
        dataSource={contacts}
        locale={{ emptyText: t.noContacts }}
        renderItem={(item) => (
          <List.Item
            style={{ cursor: "pointer", paddingInline: 8, borderRadius: 12 }}
            onClick={() => onPick?.(item)}
          >
            <List.Item.Meta
              title={item.name || t.contact}
              description={item.phone || t.noPhone}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}

function LocationPickerDrawer({
  open,
  title,
  center,
  value,
  onClose,
  onConfirm,
}) {
  const { t } = useLanguage();
  const [point, setPoint] = useState(value || null);

  useEffect(() => {
    setPoint(value || null);
  }, [value, open]);

  return (
    <Drawer title={title} placement="bottom" height="80vh" open={open} onClose={onClose}>
      <div style={{ height: 420, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(0,0,0,.08)" }}>
        <MapContainer center={point || center || [41.3111, 69.2797]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapPickerEvents onPick={setPoint} />
          {point && <Marker position={point} />}
        </MapContainer>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <Button block onClick={onClose}>{t.cancelAction}</Button>
        <Button type="primary" block disabled={!point} onClick={() => onConfirm?.(point)}>{t.saveAddress}</Button>
      </div>
    </Drawer>
  );
}

function ServiceInfoCard({ serviceMode, pickupMode, dropoffMode, matchedTripTitle }) {
  const { t } = useLanguage();
  const label = DELIVERY_SERVICE_MODES.find((item) => item.key === serviceMode)?.label || t.deliveryTitle;
  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <Space wrap>
          <Tag color="blue">{label}</Tag>
          <Tag color={pickupMode === "precise" ? "gold" : "default"}>
            {`${t.pickup}: ${pickupMode === "precise" ? t.exactAddress : t.standardPoint}`}
          </Tag>
          <Tag color={dropoffMode === "precise" ? "purple" : "default"}>
            {`${t.dropoff}: ${dropoffMode === "precise" ? t.exactAddress : t.standardPoint}`}
          </Tag>
        </Space>
        {matchedTripTitle ? <Text type="secondary">{`${t.matchedTrip}: ${matchedTripTitle}`}</Text> : null}
      </Space>
    </Card>
  );
}

function OrderCard({ order, onEdit, onDelete }) {
  const { t } = useLanguage();
  const steps = getDeliveryStatusSteps(order.status);
  return (
    <Card
      style={{ borderRadius: 22, marginTop: 12, border: "1px solid rgba(87,119,255,0.12)" }}
      bodyStyle={{ padding: 16 }}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{order.parcel_label}</div>
            <Text type="secondary">#{String(order.id).slice(-6)} • {new Date(order.created_at).toLocaleString()}</Text>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{Number(order.price || 0).toLocaleString("uz-UZ")} so‘m</div>
            <Text type="secondary">{t.cash} • {t.commission} {Number(order.commission_amount || 0).toLocaleString("uz-UZ")}</Text>
          </div>
        </div>

        <ServiceInfoCard
          serviceMode={order.service_mode}
          pickupMode={order.pickup_mode}
          dropoffMode={order.dropoff_mode}
          matchedTripTitle={order.matched_trip_title}
        />

        <div style={{ display: "grid", gap: 6 }}>
          <div><b>{t.fromLabel}:</b> {order.pickup_label}</div>
          <div><b>{t.toLabel}:</b> {order.dropoff_label}</div>
          <div><b>Qabul qiluvchi:</b> {order.receiver_name} — +998 {formatUzPhoneLabel(order.receiver_phone)}</div>
        </div>

        <Steps
          current={Math.max(0, steps.findIndex((item) => item.key === order.status))}
          items={steps.map((item) => ({ title: item.label }))}
          size="small"
          responsive
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button icon={<EditOutlined />} onClick={() => onEdit?.(order)}>
            Tahrirlash
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => onDelete?.(order)}>
            O‘chirish
          </Button>
        </div>
      </Space>
    </Card>
  );
}

const pageBg = "linear-gradient(180deg, #edf3ff 0%, #f7faff 48%, #ffffff 100%)";
const cardBg = "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)";

export default function DeliveryPage({ onBack }) {
  const { user } = useAuth();
  const { contacts, loadContacts } = useContacts();

  const [serviceMode, setServiceMode] = useState("city");
  const [pickupMode, setPickupMode] = useState("precise");
  const [dropoffMode, setDropoffMode] = useState("precise");
  const [parcelType, setParcelType] = useState("document");
  const [weightKg, setWeightKg] = useState(0);
  const [comment, setComment] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");

  const [pickup, setPickup] = useState({ region: null, district: "", point: null, label: "" });
  const [dropoff, setDropoff] = useState({ region: null, district: "", point: null, label: "" });

  const [orders, setOrders] = useState([]);
  const [availableTrips, setAvailableTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contactTarget, setContactTarget] = useState("receiver");
  const [editingId, setEditingId] = useState(null);
  const [mapTarget, setMapTarget] = useState(null);

  useEffect(() => {
    (async () => {
      setOrders(await listDeliveryOrders());
      setAvailableTrips(await listOpenIntercityTrips());
    })();
  }, []);

  useEffect(() => {
    if (serviceMode === "city") {
      setPickupMode("precise");
      setDropoffMode("precise");
    }
  }, [serviceMode]);

  const parcelMeta = useMemo(() => getParcelMeta(parcelType), [parcelType]);
  const needsWeight = parcelType === "item";

  const matchedTrip = useMemo(() => {
    if (serviceMode !== "region") return null;
    return availableTrips.find(
      (trip) =>
        trip.from_region === pickup.region &&
        trip.to_region === dropoff.region &&
        Boolean(trip.is_delivery)
    ) || null;
  }, [availableTrips, serviceMode, pickup.region, dropoff.region]);

  const pickupLabel = useMemo(() => {
    if (pickupMode === "precise") {
      return pickup.label || "Xaritadan aniq olish manzili";
    }
    return getStandardPointLabel(pickup.region, pickup.district);
  }, [pickupMode, pickup.label, pickup.region, pickup.district]);

  const dropoffLabel = useMemo(() => {
    if (dropoffMode === "precise") {
      return dropoff.label || "Xaritadan aniq topshirish manzili";
    }
    return getStandardPointLabel(dropoff.region, dropoff.district);
  }, [dropoffMode, dropoff.label, dropoff.region, dropoff.district]);

  const price = useMemo(
    () => calculateDeliveryPrice({ serviceMode, parcelType, weightKg, pickupMode, dropoffMode }),
    [serviceMode, parcelType, weightKg, pickupMode, dropoffMode]
  );

  const canSubmit = useMemo(() => {
    if (senderPhone.length !== 9 || receiverPhone.length !== 9 || !receiverName.trim()) return false;
    if (!pickup.region || !dropoff.region) return false;
    if (serviceMode !== "city" && (!pickup.district || !dropoff.district)) return false;
    if (pickupMode === "precise" && !pickup.point) return false;
    if (dropoffMode === "precise" && !dropoff.point) return false;
    if (needsWeight && (!weightKg || weightKg <= 0 || weightKg > parcelMeta.maxKg)) return false;
    return true;
  }, [senderPhone, receiverPhone, receiverName, pickup, dropoff, serviceMode, pickupMode, dropoffMode, needsWeight, weightKg, parcelMeta.maxKg]);

  const resetForm = () => {
    setEditingId(null);
    setServiceMode("city");
    setPickupMode("precise");
    setDropoffMode("precise");
    setParcelType("document");
    setWeightKg(0);
    setComment("");
    setSenderPhone("");
    setReceiverName("");
    setReceiverPhone("");
    setPickup({ region: null, district: "", point: null, label: "" });
    setDropoff({ region: null, district: "", point: null, label: "" });
  };

  const openMap = (target) => setMapTarget(target);

  const openContacts = async (target) => {
    setContactTarget(target);
    setContactsOpen(true);
    if (contacts.length > 0) return;
    setContactsLoading(true);
    try {
      await loadContacts();
    } finally {
      setContactsLoading(false);
    }
  };

  const handlePickContact = (item) => {
    const digits = clampUzPhoneDigits(item?.phone || "");
    if (contactTarget === "sender") {
      setSenderPhone(digits);
    } else {
      setReceiverPhone(digits);
      if (!receiverName) setReceiverName(item?.name || "");
    }
    setContactsOpen(false);
  };

  const handleMapSave = async (point) => {
    const fallback = `${point[0].toFixed(5)}, ${point[1].toFixed(5)}`;
    const foundLabel = await reverseGeocode(point);
    const label = foundLabel || fallback;

    if (mapTarget === "pickup") {
      setPickup((prev) => ({ ...prev, point, label }));
    } else if (mapTarget === "dropoff") {
      setDropoff((prev) => ({ ...prev, point, label }));
    }
    setMapTarget(null);
  };

  const payloadFromState = () => ({
    created_by: user?.id || null,
    service_mode: serviceMode,
    parcel_type: parcelType,
    parcel_label: parcelMeta.label,
    weight_kg: Number(weightKg || 0),
    price,
    commission_amount: calcDeliveryCommission(price),
    payment_method: "cash",
    comment,
    receiver_name: receiverName.trim(),
    receiver_phone: receiverPhone,
    sender_phone: senderPhone,
    pickup_mode: pickupMode,
    dropoff_mode: dropoffMode,
    pickup_region: pickup.region || "",
    pickup_district: pickup.district || "",
    pickup_label: pickupLabel,
    pickup_lat: pickup.point?.[0] ?? null,
    pickup_lng: pickup.point?.[1] ?? null,
    dropoff_region: dropoff.region || "",
    dropoff_district: dropoff.district || "",
    dropoff_label: dropoffLabel,
    dropoff_lat: dropoff.point?.[0] ?? null,
    dropoff_lng: dropoff.point?.[1] ?? null,
    matched_trip_id: matchedTrip?.id || null,
    matched_trip_title: matchedTrip
      ? `${matchedTrip.from_region}${matchedTrip.from_district ? ` • ${matchedTrip.from_district}` : ""} → ${matchedTrip.to_region}${matchedTrip.to_district ? ` • ${matchedTrip.to_district}` : ""}`
      : "",
  });

  const handleSubmit = async () => {
    if (parcelMeta.maxKg > 0 && Number(weightKg || 0) > parcelMeta.maxKg) {
      message.error(`Bu turdagi buyum ${parcelMeta.maxKg} kg dan oshmasligi kerak`);
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const updated = await updateDeliveryOrder(editingId, payloadFromState());
        setOrders((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        message.success("Buyurtma yangilandi");
      } else {
        const order = await createDeliveryOrder(payloadFromState());
        setOrders((prev) => [order, ...prev]);
        message.success(`${t.deliveryTitle} yaratildi`);
      }
      resetForm();
    } catch (error) {
      console.error(error);
      message.error("Buyurtma saqlanmadi");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order) => {
    setEditingId(order.id);
    setServiceMode(order.service_mode || "city");
    setPickupMode(order.pickup_mode || "precise");
    setDropoffMode(order.dropoff_mode || "precise");
    setParcelType(order.parcel_type || "document");
    setWeightKg(Number(order.weight_kg || 0));
    setComment(order.comment || "");
    setSenderPhone(clampUzPhoneDigits(order.sender_phone || ""));
    setReceiverName(order.receiver_name || "");
    setReceiverPhone(clampUzPhoneDigits(order.receiver_phone || ""));
    setPickup({
      region: order.pickup_region || null,
      district: order.pickup_district || "",
      point: order.pickup_lat != null && order.pickup_lng != null ? [Number(order.pickup_lat), Number(order.pickup_lng)] : null,
      label: order.pickup_label || "",
    });
    setDropoff({
      region: order.dropoff_region || null,
      district: order.dropoff_district || "",
      point: order.dropoff_lat != null && order.dropoff_lng != null ? [Number(order.dropoff_lat), Number(order.dropoff_lng)] : null,
      label: order.dropoff_label || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (order) => {
    Modal.confirm({
      title: "Buyurtmani o‘chirasizmi?",
      content: "Bu amalni bekor qilib bo‘lmaydi.",
      okText: "O‘chirish",
      okButtonProps: { danger: true },
      cancelText: "Bekor qilish",
      onOk: async () => {
        await deleteDeliveryOrder(order.id);
        setOrders((prev) => prev.filter((item) => item.id !== order.id));
        if (editingId === order.id) resetForm();
        message.success("Buyurtma o‘chirildi");
      },
    });
  };

  const currentCenter = getRegionCenterByName(
    mapTarget === "pickup" ? pickup.region : dropoff.region
  );

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 16, paddingBottom: 100, minHeight: "100vh", background: pageBg }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>Orqaga</Button>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Hisoblangan narx</div>
          <div style={{ fontWeight: 900, fontSize: 22 }}>{price.toLocaleString("uz-UZ")} so‘m</div>
        </div>
      </Space>

      <Card
        style={{ marginTop: 14, borderRadius: 24, background: cardBg, border: "1px solid rgba(87,119,255,0.12)", boxShadow: "0 18px 40px rgba(64,96,160,0.08)" }}
        bodyStyle={{ padding: 18 }}
      >
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>{editingId ? "Buyurtmani tahrirlash" : "Eltish xizmati"}</Title>
            <Text type="secondary">Shahar, tumanlar aro va viloyatlar aro eltish bir joyda boshqariladi.</Text>
          </div>

          <Segmented
            block
            value={serviceMode}
            onChange={setServiceMode}
            options={DELIVERY_SERVICE_MODES.map((item) => ({ value: item.key, label: item.label }))}
          />

          <Card size="small" style={{ borderRadius: 18, background: "#f8fbff", border: "1px solid rgba(87,119,255,0.1)" }}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div style={{ fontWeight: 700 }}>Qaerdan olish</div>
              <RegionDistrictSelect region={pickup.region} district={pickup.district} onChange={(next) => setPickup((prev) => ({ ...prev, ...next }))} allowEmptyDistrict={serviceMode === "city"} />
              <Radio.Group value={pickupMode} onChange={(e) => setPickupMode(e.target.value)}>
                <Space direction="vertical">
                  <Radio value="standard" disabled={serviceMode === "city"}>Standart nuqta</Radio>
                  <Radio value="precise">Xaritadan aniq manzil</Radio>
                </Space>
              </Radio.Group>
              {pickupMode === "precise" ? (
                <Button icon={<EnvironmentOutlined />} onClick={() => openMap("pickup")}>
                  {pickup.point ? "Manzilni o‘zgartirish" : "Xaritadan tanlash"}
                </Button>
              ) : null}
              <Text type="secondary">{pickupLabel}</Text>
            </Space>
          </Card>

          <Card size="small" style={{ borderRadius: 18, background: "#f8fbff", border: "1px solid rgba(87,119,255,0.1)" }}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div style={{ fontWeight: 700 }}>Qaerga topshirish</div>
              <RegionDistrictSelect region={dropoff.region} district={dropoff.district} onChange={(next) => setDropoff((prev) => ({ ...prev, ...next }))} allowEmptyDistrict={serviceMode === "city"} />
              <Radio.Group value={dropoffMode} onChange={(e) => setDropoffMode(e.target.value)}>
                <Space direction="vertical">
                  <Radio value="standard" disabled={serviceMode === "city"}>Standart nuqta</Radio>
                  <Radio value="precise">Aniq manzil</Radio>
                </Space>
              </Radio.Group>
              {dropoffMode === "precise" ? (
                <Button icon={<EnvironmentOutlined />} onClick={() => openMap("dropoff")}>
                  {dropoff.point ? "Manzilni o‘zgartirish" : "Xaritadan tanlash"}
                </Button>
              ) : null}
              <Text type="secondary">{dropoffLabel}</Text>
            </Space>
          </Card>

          <Card size="small" style={{ borderRadius: 18, background: "#f8fbff", border: "1px solid rgba(87,119,255,0.1)" }}>
            <Form layout="vertical">
              <Form.Item label="Buyum turi" style={{ marginBottom: 12 }}>
                <Segmented
                  block
                  value={parcelType}
                  onChange={setParcelType}
                  options={PARCEL_TYPES.map((item) => ({ value: item.value, label: item.label }))}
                />
              </Form.Item>
              {needsWeight ? (
                <Form.Item label={`Og‘irlik (maks: ${parcelMeta.maxKg} kg)`} style={{ marginBottom: 12 }}>
                  <InputNumber min={1} max={parcelMeta.maxKg} value={weightKg} onChange={setWeightKg} style={{ width: "100%" }} />
                </Form.Item>
              ) : null}
              <Form.Item label="Jo‘natuvchi telefon" style={{ marginBottom: 12 }}>
                <PhoneField value={senderPhone} onChange={setSenderPhone} onSelectContact={() => openContacts("sender")} />
              </Form.Item>
              <Form.Item label="Qabul qiluvchi ismi" style={{ marginBottom: 12 }}>
                <Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Ism" />
              </Form.Item>
              <Form.Item label="Qabul qiluvchi telefon" style={{ marginBottom: 12 }}>
                <PhoneField value={receiverPhone} onChange={setReceiverPhone} onSelectContact={() => openContacts("receiver")} />
              </Form.Item>
              <Form.Item label="Izoh" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Masalan: Toshkentda avtovokzalda kutib oladi" />
              </Form.Item>
            </Form>
          </Card>

          {serviceMode === "region" ? (
            <Card size="small" style={{ borderRadius: 18 }}>
              <Space direction="vertical" size={6} style={{ width: "100%" }}>
                <div style={{ fontWeight: 700 }}>Mos viloyatlar aro reys</div>
                {matchedTrip ? (
                  <Text>
                    {matchedTrip.from_region} {matchedTrip.from_district ? `• ${matchedTrip.from_district}` : ""} → {matchedTrip.to_region} {matchedTrip.to_district ? `• ${matchedTrip.to_district}` : ""}
                  </Text>
                ) : (
                  <Text type="secondary">Hozircha mos reys topilmadi. Buyurtma baribir saqlanadi, haydovchi keyin qabul qilishi mumkin.</Text>
                )}
              </Space>
            </Card>
          ) : null}

          <Card size="small" style={{ borderRadius: 18, background: "#fffdf0", border: "1px solid rgba(255,196,52,0.25)" }}>
            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              <div style={{ fontWeight: 700 }}>Narx qanday hisoblandi</div>
              <Text>Asosiy tarif + olish rejimi + topshirish rejimi + buyum turi.</Text>
              <Text>Komissiya faqat ko‘rsatilgan narxdan olinadi. To‘lov usuli: naqd.</Text>
            </Space>
          </Card>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              disabled={!canSubmit}
              loading={loading}
              onClick={handleSubmit}
              style={{ borderRadius: 18, height: 52, fontWeight: 800, flex: 1, minWidth: 220 }}
            >
              {editingId ? "O‘zgarishlarni saqlash" : "Buyurtma berish"}
            </Button>
            {editingId ? (
              <Button size="large" style={{ borderRadius: 18, height: 52, fontWeight: 700 }} onClick={resetForm}>
                Bekor qilish
              </Button>
            ) : null}
          </div>
        </Space>
      </Card>

      <div style={{ marginTop: 18 }}>
        <Title level={5} style={{ marginBottom: 8 }}>Mening eltish buyurtmalarim</Title>
        {orders.length === 0 ? (
          <Card style={{ borderRadius: 18 }}><Empty description="Hozircha eltish buyurtmasi yo‘q" /></Card>
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

      <LocationPickerDrawer
        open={Boolean(mapTarget)}
        title={mapTarget === "pickup" ? "Olish manzilini tanlang" : "Topshirish manzilini tanlang"}
        center={currentCenter}
        value={mapTarget === "pickup" ? pickup.point : dropoff.point}
        onClose={() => setMapTarget(null)}
        onConfirm={handleMapSave}
      />

      <ContactPickerModal
        open={contactsOpen}
        onClose={() => setContactsOpen(false)}
        contacts={contacts}
        onPick={handlePickContact}
        loading={contactsLoading}
      />
    </div>
  );
}
