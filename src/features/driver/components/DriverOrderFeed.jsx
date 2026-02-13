import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, List, Button, Tag, Typography, message, Empty, Skeleton } from "antd";
import {
  CheckOutlined,
  ClockCircleOutlined,
  CarOutlined,
  EnvironmentOutlined,
  SendOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { translations } from "@i18n/translations";
import { supabase } from "../../../lib/supabase";

// --- MAP ICON FIX ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Maxsus mashina ikonchasi
const carIcon = L.divIcon({
  html: '<div style="font-size: 24px;">🚖</div>',
  className: "car-marker",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const { Text, Title } = Typography;

// ✅ SHAHAR ICHIDAGI TARIFLAR (Viloyat buyurtmalarini ajratish uchun)
const CITY_TARIFFS = ['start', 'comfort', 'taxi', 'econom'];

// Xaritani markazlashtirish komponenti
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, map]);
  return null;
}

// Marker harakati uchun komponent
function SmoothDriverMarker({ position }) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      const element = markerRef.current.getElement();
      if (element) element.style.transition = "transform 2s linear";
    }
  }, [position]);

  return <Marker ref={markerRef} position={position} icon={carIcon} />;
}

// Koordinatalarni parsing qilish
const parseLatLng = (locString) => {
  if (!locString || typeof locString !== "string") return null;
  const match = locString.match(/Lat:\s*([0-9.]+),\s*Lng:\s*([0-9.]+)/i);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
};

export default function DriverOrderFeed() {
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Haydovchi joylashuvi (Simulyatsiya - Nukus)
  const [driverLoc] = useState([42.4619, 59.6166]);

  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  // ✅ Shahar ichidagi buyurtmalarni yuklash (Filtrlangan)
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["pending", "searching"])
        .is("driver_id", null)
        .in("service_type", CITY_TARIFFS) // Faqat shahar tariflari
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Fetch xato:", err);
      message.error("Buyurtmalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  const checkActiveOrder = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("driver_id", user.id)
        .in("status", ["accepted", "arrived", "in_progress"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("checkActiveOrder error:", error);
        return;
      }

      if (data) setActiveOrder(data);
    } catch (err) {
      console.error("checkActiveOrder err:", err);
    }
  }, []);

  useEffect(() => {
    checkActiveOrder();
    fetchOrders();

    // ✅ REALTIME: Shahar ichi buyurtmalarini jonli kuzatish
    const channel = supabase
      .channel("driver-orders-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const rowNew = payload.new;
          const rowOld = payload.old;

          // Yangi buyurtma qo'shilganda (INSERT)
          if (payload.eventType === "INSERT") {
            const isRelevant = ["pending", "searching"].includes(rowNew?.status);
            const isFree = !rowNew?.driver_id;
            const isCityService = CITY_TARIFFS.includes(rowNew?.service_type);

            if (isRelevant && isFree && isCityService) {
              setOrders((prev) => [rowNew, ...prev]);
              message.info("Yangi shahar ichi buyurtmasi!");
            }
            return;
          }

          // Buyurtma o'zgarganda (UPDATE)
          if (payload.eventType === "UPDATE") {
            const statusOk = ["pending", "searching"].includes(rowNew?.status);
            const isFree = !rowNew?.driver_id;
            const isCityService = CITY_TARIFFS.includes(rowNew?.service_type);

            // Agar endi mavjud bo'lmasa yoki boshqa turga o'tib ketsa -> o'chirish
            if (!statusOk || !isFree || !isCityService) {
              setOrders((prev) => prev.filter((o) => o.id !== rowNew?.id));
            } else {
              setOrders((prev) => {
                const exists = prev.some((o) => o.id === rowNew.id);
                if (!exists) return [rowNew, ...prev];
                return prev.map((o) => (o.id === rowNew.id ? rowNew : o));
              });
            }
            return;
          }

          // Buyurtma o'chirilganda (DELETE)
          if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== rowOld?.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkActiveOrder, fetchOrders]);

  // --- ACTIONS ---

  const acceptOrder = async (order) => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user?.id) {
        message.error("Tizimga kiring!");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .update({
          status: "accepted",
          driver_id: user.id,
        })
        .eq("id", order.id)
        .is("driver_id", null)
        .in("status", ["pending", "searching"])
        .select()
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        message.warning("Kechirasiz, bu buyurtmani boshqa haydovchi oldi.");
        await fetchOrders();
        return;
      }

      message.success("Buyurtma qabul qilindi!");
      setActiveOrder(data);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (error) {
      console.error("Accept error:", error);
      message.error(error?.message || "Xatolik yuz berdi");
    }
  };

  const updateStatus = async (newStatus) => {
    if (!activeOrder) return;

    const { data, error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", activeOrder.id)
      .select()
      .maybeSingle();

    if (error) {
      message.error("Status yangilashda xatolik");
      return;
    }

    setActiveOrder(data || { ...activeOrder, status: newStatus });

    if (newStatus === "arrived") message.success("Mijozga xabar yuborildi!");
    if (newStatus === "in_progress") message.success("Safar boshlandi!");
    if (newStatus === "completed") {
      message.success("Safar yakunlandi!");
      setActiveOrder(null);
      fetchOrders();
    }
  };

  const btnTouchProps = {
    onMouseDown: (e) => (e.currentTarget.style.transform = "scale(0.96)"),
    onMouseUp: (e) => (e.currentTarget.style.transform = "scale(1)"),
    onTouchStart: (e) => (e.currentTarget.style.transform = "scale(0.96)"),
    onTouchEnd: (e) => (e.currentTarget.style.transform = "scale(1)"),
    style: { transition: "transform 0.1s" },
  };

  // --- AGAR AKTIV BUYURTMA BO'LSA -> XARITA REJIMI ---
  if (activeOrder) {
    const clientPos = parseLatLng(activeOrder.pickup_location) || [42.4619, 59.6166];
    const destPos = parseLatLng(activeOrder.dropoff_location);

    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <MapContainer
            center={clientPos}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <Marker position={clientPos}>
              <Popup>Yo'lovchi</Popup>
            </Marker>
            <SmoothDriverMarker position={driverLoc} />
            {destPos && (
              <Marker position={destPos}>
                <Popup>Borish manzili</Popup>
              </Marker>
            )}
            <RecenterMap lat={clientPos[0]} lng={clientPos[1]} />
          </MapContainer>
        </div>

        <div
          style={{
            padding: 25,
            background: "#fff",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.15)",
            borderRadius: "30px 30px 0 0",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
              alignItems: "center",
            }}
          >
            <div style={{ maxWidth: "80%" }}>
              <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
                Mijoz kutyapti
              </Title>
              <div style={{ display: "flex", alignItems: "center", marginTop: 5 }}>
                <EnvironmentOutlined style={{ color: "#52c41a", marginRight: 5 }} />
                <Text type="secondary" ellipsis>
                  {activeOrder.pickup_location}
                </Text>
              </div>
            </div>
            <Button
              shape="circle"
              size="large"
              icon={<PhoneOutlined />}
              type="primary"
              style={{ background: "#52c41a" }}
            />
          </div>

          {activeOrder.status === "accepted" && (
            <Button
              block
              type="primary"
              size="large"
              {...btnTouchProps}
              onClick={() => updateStatus("arrived")}
              style={{
                height: 60,
                borderRadius: 20,
                background: "black",
                fontWeight: 700,
                ...btnTouchProps.style,
              }}
            >
              YETIB KELDIM 🏁
            </Button>
          )}

          {activeOrder.status === "arrived" && (
            <Button
              block
              type="primary"
              size="large"
              {...btnTouchProps}
              onClick={() => updateStatus("in_progress")}
              style={{
                height: 60,
                borderRadius: 20,
                background: "#faad14",
                color: "black",
                fontWeight: 700,
                ...btnTouchProps.style,
              }}
            >
              KETDIK (SAFARNI BOSHLASH) 🚖
            </Button>
          )}

          {activeOrder.status === "in_progress" && (
            <Button
              block
              type="primary"
              danger
              size="large"
              {...btnTouchProps}
              onClick={() => updateStatus("completed")}
              style={{
                height: 60,
                borderRadius: 20,
                fontWeight: 700,
                ...btnTouchProps.style,
              }}
            >
              SAFARNI YAKUNLASH ✅
            </Button>
          )}
        </div>
      </div>
    );
  }

  // --- BUYURTMALAR RO'YXATI ---
  return (
    <div style={{ padding: "15px", paddingBottom: "100px", minHeight: "100vh", background: "#f8f9fa" }}>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 800 }}>
        {t?.nearOrders || "Yaqin-atrofdagi buyurtmalar"}
      </Title>

      {loading ? (
        [1, 2, 3].map((i) => (
          <Card key={i} style={{ marginBottom: 15, borderRadius: 24 }}>
            <Skeleton active avatar />
          </Card>
        ))
      ) : (
        <List
          dataSource={orders}
          locale={{ emptyText: <Empty description="Buyurtmalar mavjud emas" /> }}
          renderItem={(item) => (
            <Card
              key={item.id}
              style={{
                marginBottom: 15,
                borderRadius: 24,
                boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
                border: "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                <Tag color="blue" icon={<CarOutlined />}>
                  {(item.service_type || "taxi").toUpperCase()}
                </Tag>
                <Title level={4} style={{ margin: 0, color: "#52c41a", fontWeight: 800 }}>
                  {Number(item.price || 0).toLocaleString()} so'm
                </Title>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <EnvironmentOutlined style={{ color: "#52c41a", fontSize: 18 }} />
                  <Text strong>{item.pickup_location}</Text>
                </div>
                <div style={{ borderLeft: "2px dashed #e0e0e0", height: 15, marginLeft: 9, margin: "0 0 5px 0" }}></div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <EnvironmentOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
                  <Text strong>
                    {item.dropoff_location && item.dropoff_location.includes("Lat:") 
                      ? "Xaritada belgilangan joy" 
                      : (item.dropoff_location || "Noma'lum")}
                  </Text>
                </div>
              </div>

              <Button
                type="primary"
                block
                size="large"
                icon={<CheckOutlined />}
                {...btnTouchProps}
                style={{
                  background: "black",
                  height: 55,
                  borderRadius: 18,
                  fontWeight: 700,
                  border: "none",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  ...btnTouchProps.style,
                }}
                onClick={() => acceptOrder(item)}
              >
                QABUL QILISH
              </Button>
            </Card>
          )}
        />
      )}
    </div>
  );
}