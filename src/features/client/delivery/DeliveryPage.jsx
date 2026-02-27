import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Divider, message, Typography } from "antd";
import { ArrowLeftOutlined, SendOutlined, StopOutlined } from "@ant-design/icons";

import DeliveryMap from "./map/DeliveryMap";
import SenderForm from "./components/Setup/SenderForm";
import ReceiverForm from "./components/Setup/ReceiverForm";
import ParcelTypeChips from "./components/Setup/ParcelTypeChips";
import WeightSelector from "./components/Setup/WeightSelector";
import PhotoUploader from "./components/Setup/PhotoUploader";

import DoorToDoorToggle from "./components/Options/DoorToDoorToggle";
import WhoPaysSwitch from "./components/Options/WhoPaysSwitch";
import CommentInput from "./components/Options/CommentInput";

import CourierInfoCard from "./components/Active/CourierInfoCard";
import StatusTimeline from "./components/Active/StatusTimeline";
import PinCodeDisplay from "./components/Active/PinCodeDisplay";

import { useDeliveryState } from "./hooks/useDeliveryState";
import { useDeliveryPrice } from "./hooks/useDeliveryPrice";
import { deliveryApi } from "./services/deliveryApi";

const { Title, Text } = Typography;

export default function DeliveryPage({ onBack }) {
  const { step, setStep, status, setStatus } = useDeliveryState();

  const [selecting, setSelecting] = useState("pickup"); // pickup | drop | null

  const [pickup, setPickup] = useState({ latlng: null, address: "", entrance: "", floor: "", apartment: "" });
  const [drop, setDrop] = useState({ latlng: null, address: "", entrance: "", floor: "", apartment: "" });

  const [sender, setSender] = useState({ phone: "", entrance: "", floor: "", apartment: "" });
  const [receiver, setReceiver] = useState({ name: "", phone: "" });

  const [parcelType, setParcelType] = useState("document");
  const [weightCategory, setWeightCategory] = useState(1);

  const [doorToDoor, setDoorToDoor] = useState(false);
  const [whoPays, setWhoPays] = useState("sender"); // sender|receiver
  const [comment, setComment] = useState("");

  const [photos, setPhotos] = useState([]); // [{file,url}]
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);

  const [orderId, setOrderId] = useState(() => {
    try { return localStorage.getItem("activeDeliveryOrderId") || ""; } catch { return ""; }
  });

  const [secureCode, setSecureCode] = useState("");
  const [courier, setCourier] = useState(null); // {name,phone,avatar,vehicle,lat,lng,bearing}

  const { price } = useDeliveryPrice({ distanceKm, weightCategory, doorToDoor, parcelType });

  const canCreate = useMemo(() => {
    if (!pickup.latlng) return false;
    if (!drop.latlng) return false;
    if (!sender.phone) return false;
    if (!receiver.phone || !receiver.name) return false;
    return true;
  }, [pickup.latlng, drop.latlng, sender.phone, receiver.phone, receiver.name]);

  const onRouteMeta = useCallback(({ distanceKm: km, durationMin: min }) => {
    setDistanceKm(km || 0);
    setDurationMin(min || 0);
  }, []);

  // Reload muammosi: serverdan aktiv order so'rash (best-effort)
  useEffect(() => {
    // Agar server active_delivery action qaytarsa:
    // (async () => { const res = await deliveryApi.active(); ... })();
  }, []);

  const handleCreate = useCallback(async () => {
    if (!canCreate) {
      message.error("Manzillar va ma'lumotlarni to'liq to'ldiring");
      return;
    }
    const hide = message.loading("Buyurtma yuborilmoqda...", 0);
    try {
      const payload = {
        sender_phone: sender.phone,
        receiver_phone: receiver.phone,
        receiver_name: receiver.name,
        parcel_type: parcelType,
        weight_category: weightCategory,
        door_to_door: doorToDoor,
        who_pays: whoPays,
        comment,
        photos: photos.map((p) => p.url), // demo: url. Real: serverga upload qilib URL olish
        pickup_location: {
          lat: pickup.latlng[0],
          lng: pickup.latlng[1],
          address: pickup.address,
          entrance: sender.entrance || pickup.entrance || "",
          floor: sender.floor || pickup.floor || "",
          apartment: sender.apartment || pickup.apartment || "",
        },
        drop_location: {
          lat: drop.latlng[0],
          lng: drop.latlng[1],
          address: drop.address,
          entrance: drop.entrance || "",
          floor: drop.floor || "",
          apartment: drop.apartment || "",
        },
        price,
        distance_km: distanceKm,
        duration_min: durationMin,
      };

      const res = await deliveryApi.create(payload);
      const id = res?.data?.id || res?.id || res?.orderId;
      const code = res?.data?.secure_code || res?.secure_code || res?.data?.secureCode || "";
      setOrderId(String(id || ""));
      if (id) {
        try { localStorage.setItem("activeDeliveryOrderId", String(id)); } catch {}
      }
      if (code) setSecureCode(String(code));
      setStatus("searching");
      setStep("searching");
      message.success("Buyurtma yuborildi");
    } catch (e) {
      console.error(e);
      message.error("Xatolik: " + (e?.message || "Server bilan aloqa yo‘q"));
    } finally {
      hide();
    }
  }, [canCreate, sender, receiver, parcelType, weightCategory, doorToDoor, whoPays, comment, photos, pickup, drop, price, distanceKm, durationMin, setStatus, setStep]);

  const handleCancel = useCallback(async () => {
    if (!orderId) {
      setStep("setup");
      setStatus("");
      return;
    }
    const hide = message.loading("Bekor qilinmoqda...", 0);
    try {
      await deliveryApi.cancel(orderId);
      setOrderId("");
      setCourier(null);
      setSecureCode("");
      try { localStorage.removeItem("activeDeliveryOrderId"); } catch {}
      setStep("setup");
      setStatus("");
      message.success("Bekor qilindi");
    } catch (e) {
      message.error("Bekor qilishda xatolik: " + (e?.message || ""));
    } finally {
      hide();
    }
  }, [orderId, setStep, setStatus]);

  // Polling status
  useEffect(() => {
    if (!orderId) return;
    let stop = false;

    const tick = async () => {
      try {
        const res = await deliveryApi.status(orderId);
        const st = res?.data?.status || res?.status || "";
        const meta = res?.data?.courier_meta || res?.courier_meta || res?.data?.courier || res?.courier || null;
        const code = res?.data?.secure_code || res?.secure_code || "";

        if (stop) return;

        if (code) setSecureCode(String(code));
        if (meta) setCourier(meta);

        if (st) setStatus(st);

        if (st === "searching") setStep("searching");
        if (st === "pickup" || st === "delivering") setStep("active");
        if (st === "completed" || st === "cancelled") {
          setStep("setup");
          setOrderId("");
          setCourier(null);
          setSecureCode("");
          try { localStorage.removeItem("activeDeliveryOrderId"); } catch {}
        }
      } catch {
        // ignore
      }
    };

    const iid = setInterval(tick, 4000);
    tick();
    return () => {
      stop = true;
      clearInterval(iid);
    };
  }, [orderId, setStatus, setStep]);

  return (
    <div style={{ padding: 14, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ borderRadius: 14 }}>
          Orqaga
        </Button>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>Taxminiy narx</div>
          <div style={{ fontWeight: 1100, fontSize: 18 }}>{price.toLocaleString("uz-UZ")} so‘m</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <DeliveryMap
          pickup={pickup}
          drop={drop}
          onPickupChange={setPickup}
          onDropChange={setDrop}
          selecting={selecting}
          setSelecting={setSelecting}
          onRouteMeta={onRouteMeta}
          courier={courier && courier.lat && courier.lng ? courier : null}
        />
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {step === "setup" && (
          <>
            <SenderForm value={sender} onChange={setSender} />
            <ReceiverForm value={receiver} onChange={setReceiver} />
            <ParcelTypeChips value={parcelType} onChange={setParcelType} />
            <WeightSelector value={weightCategory} onChange={setWeightCategory} />
            <PhotoUploader photos={photos} onChange={setPhotos} />

            <DoorToDoorToggle value={doorToDoor} onChange={setDoorToDoor} />
            <WhoPaysSwitch value={whoPays} onChange={setWhoPays} />
            <CommentInput value={comment} onChange={setComment} />

            <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 1000 }}>Masofa</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{distanceKm ? distanceKm.toFixed(1) : "—"} km • {durationMin ? Math.round(durationMin) : "—"} daq</Text>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 1100, fontSize: 18 }}>{price.toLocaleString("uz-UZ")} so‘m</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Narx: masofa + og‘irlik + eshikkacha</Text>
                </div>
              </div>
            </Card>

            <div style={{ position: "sticky", bottom: 12, zIndex: 5 }}>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                style={{ width: "100%", borderRadius: 18, height: 52, fontWeight: 1000 }}
                onClick={handleCreate}
                disabled={!canCreate}
              >
                Buyurtma berish
              </Button>
            </div>
          </>
        )}

        {step === "searching" && (
          <>
            <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
              <Title level={5} style={{ margin: 0 }}>Kuryer qidirilmoqda...</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Yaqin atrofdagi kuryerlarga so‘rov yuborilyapti.
              </Text>
              <Divider style={{ margin: "10px 0" }} />
              <Button danger icon={<StopOutlined />} onClick={handleCancel} style={{ borderRadius: 14, width: "100%" }}>
                Buyurtmani bekor qilish
              </Button>
            </Card>
            <PinCodeDisplay code={secureCode} />
          </>
        )}

        {step === "active" && (
          <>
            <CourierInfoCard courier={courier} />
            <StatusTimeline status={status} />
            <PinCodeDisplay code={secureCode} />
            <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>Manzillar</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                A: {pickup.address || "—"} <br />
                B: {drop.address || "—"}
              </Text>
              <Divider style={{ margin: "10px 0" }} />
              <Button danger onClick={handleCancel} style={{ borderRadius: 14, width: "100%" }}>
                Buyurtmani bekor qilish
              </Button>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
