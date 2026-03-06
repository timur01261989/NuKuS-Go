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
  EnvironmentOutlined,
  PhoneOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

import { useAuth } from "@/shared/auth/AuthProvider";
import RegionDistrictSelect from "@/shared/components/RegionDistrictSelect";
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
  listDeliveryOrders,
  listOpenIntercityTrips,
} from "./services/deliveryStore";

import "leaflet/dist/leaflet.css";

const { Title, Text } = Typography;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapPickerEvents({ onPick }) {
  useMapEvents({
    click(e) {
      onPick?.([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function LocationPickerDrawer({
  open,
  title,
  center,
  value,
  onClose,
  onConfirm,
}) {
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
        <Button block onClick={onClose}>
          Bekor qilish
        </Button>
        <Button type="primary" block disabled={!point} onClick={() => onConfirm?.(point)}>
          Manzilni saqlash
        </Button>
      </div>
    </Drawer>
  );
}

function ServiceInfoCard({ serviceMode, pickupMode, dropoffMode, matchedTripTitle }) {
  const label = DELIVERY_SERVICE_MODES.find((item) => item.key === serviceMode)?.label || "Eltish";
  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <Space wrap>
          <Tag color="blue">{label}</Tag>
          <Tag color={pickupMode === "precise" ? "gold" : "default"}>
            Pickup: {pickupMode === "precise" ? "aniq manzil" : "standart nuqta"}
          </Tag>
          <Tag color={dropoffMode === "precise" ? "purple" : "default"}>
            Dropoff: {dropoffMode === "precise" ? "aniq manzil" : "standart nuqta"}
          </Tag>
        </Space>
        {matchedTripTitle ? <Text type="secondary">Mos reys: {matchedTripTitle}</Text> : null}
      </Space>
    </Card>
  );
}

function OrderCard({ order }) {
  const steps = getDeliveryStatusSteps(order.status);
  return (
    <Card style={{ borderRadius: 18, marginTop: 12 }} bodyStyle={{ padding: 14 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800 }}>{order.parcel_label}</div>
            <Text type="secondary">#{String(order.id).slice(-6)} • {new Date(order.created_at).toLocaleString()}</Text>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800 }}>{Number(order.price || 0).toLocaleString("uz-UZ")} so‘m</div>
            <Text type="secondary">Naqd • komissiya {Number(order.commission_amount || 0).toLocaleString("uz-UZ")}</Text>
          </div>
        </div>

        <ServiceInfoCard
          serviceMode={order.service_mode}
          pickupMode={order.pickup_mode}
          dropoffMode={order.dropoff_mode}
          matchedTripTitle={order.matched_trip_title}
        />

        <div>
          <div><b>Qaerdan:</b> {order.pickup_label}</div>
          <div><b>Qaerga:</b> {order.dropoff_label}</div>
          <div><b>Qabul qiluvchi:</b> {order.receiver_name} — {order.receiver_phone}</div>
        </div>

        <Steps
          current={Math.max(0, steps.findIndex((item) => item.key === order.status))}
          items={steps.map((item) => ({ title: item.label }))}
          size="small"
          responsive
        />
      </Space>
    </Card>
  );
}

export default function DeliveryPage({ onBack }) {
  const { user } = useAuth();
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
    if (!senderPhone || !receiverName || !receiverPhone) return false;
    if (!pickup.region || !dropoff.region) return false;
    if (serviceMode !== "city" && (!pickup.district || !dropoff.district)) return false;
    if (pickupMode === "precise" && !pickup.point) return false;
    if (dropoffMode === "precise" && !dropoff.point) return false;
    if (needsWeight && (!weightKg || weightKg <= 0 || weightKg > parcelMeta.maxKg)) return false;
    return true;
  }, [senderPhone, receiverName, receiverPhone, pickup, dropoff, serviceMode, pickupMode, dropoffMode, needsWeight, weightKg, parcelMeta.maxKg]);

  const openMap = (target) => setMapTarget(target);

  const handleMapSave = (point) => {
    const label = `${point[0].toFixed(5)}, ${point[1].toFixed(5)}`;
    if (mapTarget === "pickup") {
      setPickup((prev) => ({ ...prev, point, label }));
    } else if (mapTarget === "dropoff") {
      setDropoff((prev) => ({ ...prev, point, label }));
    }
    setMapTarget(null);
  };

  const handleSubmit = async () => {
    if (parcelMeta.maxKg > 0 && Number(weightKg || 0) > parcelMeta.maxKg) {
      message.error(`Bu turdagi buyum ${parcelMeta.maxKg} kg dan oshmasligi kerak`);
      return;
    }
    setLoading(true);
    try {
      const order = await createDeliveryOrder({
        created_by: user?.id || null,
        service_mode: serviceMode,
        parcel_type: parcelType,
        parcel_label: parcelMeta.label,
        weight_kg: Number(weightKg || 0),
        price,
        commission_amount: calcDeliveryCommission(price),
        payment_method: "cash",
        comment,
        receiver_name: receiverName,
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
      setOrders((prev) => [order, ...prev]);
      message.success("Eltish buyurtmasi yaratildi");
      setComment("");
      setReceiverName("");
      setReceiverPhone("");
      setSenderPhone("");
    } catch (error) {
      console.error(error);
      message.error("Buyurtma saqlanmadi");
    } finally {
      setLoading(false);
    }
  };

  const currentCenter = getRegionCenterByName(
    mapTarget === "pickup" ? pickup.region : dropoff.region
  );

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 16, paddingBottom: 100 }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>Orqaga</Button>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Hisoblangan narx</div>
          <div style={{ fontWeight: 900, fontSize: 22 }}>{price.toLocaleString("uz-UZ")} so‘m</div>
        </div>
      </Space>

      <Card style={{ marginTop: 14, borderRadius: 22 }} bodyStyle={{ padding: 18 }}>
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>Eltish xizmati</Title>
            <Text type="secondary">Shahar, tumanlar aro va viloyatlar aro eltish bir joyda boshqariladi.</Text>
          </div>

          <Segmented
            block
            value={serviceMode}
            onChange={setServiceMode}
            options={DELIVERY_SERVICE_MODES.map((item) => ({ value: item.key, label: item.label }))}
          />

          <Card size="small" style={{ borderRadius: 16, background: "#fafafa" }}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div style={{ fontWeight: 700 }}>Qaerdan olish</div>
              <RegionDistrictSelect label="Pickup" region={pickup.region} district={pickup.district} onChange={(next) => setPickup((prev) => ({ ...prev, ...next }))} allowEmptyDistrict={serviceMode === "city"} />
              <Radio.Group value={pickupMode} onChange={(e) => setPickupMode(e.target.value)}>
                <Space direction="vertical">
                  <Radio value="standard" disabled={serviceMode === "city"}>Standart nuqta</Radio>
                  <Radio value="precise">Xaritadan aniq manzil</Radio>
                </Space>
              </Radio.Group>
              {pickupMode === "precise" ? (
                <Button icon={<EnvironmentOutlined />} onClick={() => openMap("pickup")}>
                  {pickup.point ? "Pickup manzilni o‘zgartirish" : "Pickup manzilni xaritadan tanlash"}
                </Button>
              ) : null}
              <Text type="secondary">{pickupLabel}</Text>
            </Space>
          </Card>

          <Card size="small" style={{ borderRadius: 16, background: "#fafafa" }}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div style={{ fontWeight: 700 }}>Qaerga topshirish</div>
              <RegionDistrictSelect label="Dropoff" region={dropoff.region} district={dropoff.district} onChange={(next) => setDropoff((prev) => ({ ...prev, ...next }))} allowEmptyDistrict={serviceMode === "city"} />
              <Radio.Group value={dropoffMode} onChange={(e) => setDropoffMode(e.target.value)}>
                <Space direction="vertical">
                  <Radio value="standard" disabled={serviceMode === "city"}>Standart nuqta</Radio>
                  <Radio value="precise">Aniq manzil</Radio>
                </Space>
              </Radio.Group>
              {dropoffMode === "precise" ? (
                <Button icon={<EnvironmentOutlined />} onClick={() => openMap("dropoff")}>
                  {dropoff.point ? "Dropoff manzilni o‘zgartirish" : "Dropoff manzilni xaritadan tanlash"}
                </Button>
              ) : null}
              <Text type="secondary">{dropoffLabel}</Text>
            </Space>
          </Card>

          <Card size="small" style={{ borderRadius: 16, background: "#fafafa" }}>
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
                <Input prefix={<PhoneOutlined />} value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="+998..." />
              </Form.Item>
              <Form.Item label="Qabul qiluvchi ismi" style={{ marginBottom: 12 }}>
                <Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Ism" />
              </Form.Item>
              <Form.Item label="Qabul qiluvchi telefon" style={{ marginBottom: 12 }}>
                <Input prefix={<PhoneOutlined />} value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="+998..." />
              </Form.Item>
              <Form.Item label="Izoh" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Masalan: Toshkentda avtovokzalda kutib oladi" />
              </Form.Item>
            </Form>
          </Card>

          {serviceMode === "region" ? (
            <Card size="small" style={{ borderRadius: 16 }}>
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

          <Card size="small" style={{ borderRadius: 16, background: "#fffbe6" }}>
            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              <div style={{ fontWeight: 700 }}>Narx qanday hisoblandi</div>
              <Text>Asosiy tarif + pickup rejimi + dropoff rejimi + buyum turi.</Text>
              <Text>Komissiya faqat ko‘rsatilgan narxdan olinadi. To‘lov usuli: naqd.</Text>
            </Space>
          </Card>

          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            disabled={!canSubmit}
            loading={loading}
            onClick={handleSubmit}
            style={{ borderRadius: 18, height: 52, fontWeight: 800 }}
          >
            Buyurtma berish
          </Button>
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
                <OrderCard order={item} />
              </List.Item>
            )}
          />
        )}
      </div>

      <LocationPickerDrawer
        open={Boolean(mapTarget)}
        title={mapTarget === "pickup" ? "Pickup manzilni tanlang" : "Dropoff manzilni tanlang"}
        center={currentCenter}
        value={mapTarget === "pickup" ? pickup.point : dropoff.point}
        onClose={() => setMapTarget(null)}
        onConfirm={handleMapSave}
      />
    </div>
  );
}
