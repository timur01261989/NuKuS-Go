import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, List, Button, Tag, Typography, message, Empty, Skeleton, Modal } from "antd";
import {
  CheckOutlined,
  CarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  RocketOutlined
} from "@ant-design/icons";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { translations } from "@i18n/translations";
import api from "@/utils/apiHelper"; // ✅ YANGI: API orqali ishlash
import { playAliceVoice } from "@/utils/audioPlayer"; // ✅ Ovozli yordamchi

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
  html: '<div style="font-size: 24px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">🚖</div>',
  className: "car-marker",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const clientIcon = L.divIcon({
  html: '<div style="font-size: 24px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">🙋‍♂️</div>',
  className: "client-marker",
  iconSize: [30, 30],
  iconAnchor: [15, 25],
});

const { Text, Title } = Typography;

// ✅ SHAHAR ICHIDAGI TARIFLAR
const CITY_TARIFFS = ['start', 'comfort', 'taxi', 'econom'];

// Xaritani markazlashtirish komponenti
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      map.setView([lat, lng], 15, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

// Marker harakati uchun komponent
function SmoothDriverMarker({ position }) {
  const markerRef = useRef(null);
  useEffect(() => {
    if (markerRef.current && position) {
      const element = markerRef.current.getElement();
      if (element) {
        element.style.transition = "transform 1s linear";
      }
    }
  }, [position]);
  return <Marker ref={markerRef} position={position || [0,0]} icon={carIcon} />;
}

// Koordinatalarni parsing qilish
const parseLatLng = (locString) => {
  if (!locString || typeof locString !== "string") return null;
  // Format: "Lat: 41.123, Lng: 69.123" yoki oddiy matn
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
  
  // Haydovchi joylashuvi
  const [driverLoc, setDriverLoc] = useState([42.4619, 59.6166]); // Default Nukus

  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  // Geolokatsiyani kuzatish
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setDriverLoc([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn("GPS error:", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // 1. Aktiv buyurtmani tekshirish (Polling)
  const checkActiveOrder = useCallback(async () => {
    try {
      // Serverdan: "Menda tugallanmagan buyurtma bormi?"
      const res = await api.post("/api/order", { action: "active_driver" });
      if (res.success && res.order) {
        setActiveOrder(res.order);
      } else {
        // Agar aktiv buyurtma bo'lmasa, null qilamiz (serverda tugatilgan bo'lishi mumkin)
        setActiveOrder(null); 
      }
    } catch (err) {
      console.error("Check active order error:", err);
    }
  }, []);

  // 2. Buyurtmalar lentasini yuklash (Polling)
  const fetchOrders = useCallback(async () => {
    // Agar haydovchi band bo'lsa, yangi buyurtma qidirmaymiz
    if (activeOrder) return; 

    setLoading((prev) => orders.length === 0 ? true : prev); // Faqat birinchi marta loading ko'rsatish
    try {
      const res = await api.post("/api/order", { 
        action: "list_available", 
        service_types: CITY_TARIFFS 
      });
      
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeOrder, orders.length]);

  // Polling mexanizmi (har 5 soniyada)
  useEffect(() => {
    checkActiveOrder();
    fetchOrders();

    const interval = setInterval(() => {
      checkActiveOrder();
      if (!activeOrder) fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [checkActiveOrder, fetchOrders, activeOrder]);


  // --- ACTIONS (Serverga so'rovlar) ---

  const acceptOrder = async (orderId) => {
    try {
      message.loading("Qabul qilinmoqda...", 1);
      const res = await api.post("/api/order", { 
        action: "accept", 
        orderId: orderId,
        driverLat: driverLoc[0],
        driverLng: driverLoc[1]
      });

      if (res.success) {
        message.success("Buyurtma qabul qilindi!");
        setActiveOrder(res.order);
        setOrders([]); // Lentani tozalash
        playAliceVoice("order_accepted"); // 🔊 "Buyurtma qabul qilindi"
      } else {
        message.warning(res.message || "Bu buyurtmani boshqa haydovchi oldi");
        fetchOrders(); // Ro'yxatni yangilash
      }
    } catch (error) {
      console.error("Accept error:", error);
      message.error("Xatolik yuz berdi");
    }
  };

  const updateStatus = async (newStatus) => {
    if (!activeOrder) return;

    try {
      const res = await api.post("/api/order", { 
        action: "update_status", 
        orderId: activeOrder.id, 
        status: newStatus 
      });

      if (res.success) {
        setActiveOrder(res.order);

        // Ovozli xabarlar va vizual effektlar
        if (newStatus === "arrived") {
          message.success("Mijozga xabar yuborildi!");
          playAliceVoice("arrived"); // 🔊 "Manzilga yetib keldingiz" (yoki shunga o'xshash)
        }
        if (newStatus === "in_progress") {
          message.success("Safar boshlandi!");
          playAliceVoice("start_trip"); // 🔊 "Harakatni boshlaymiz"
        }
        if (newStatus === "completed") {
          message.success(`Safar yakunlandi! Hisobingizga tushdi: ${res.price} so'm`);
          playAliceVoice("completed"); // 🔊 "Safar yakunlandi"
          setActiveOrder(null);
          fetchOrders(); // Yana lentaga qaytish
        }
      } else {
        message.error(res.message || "Status o'zgarmadi");
      }
    } catch (e) {
      console.error(e);
      message.error("Internet bilan aloqa yo'q");
    }
  };

  const callClient = () => {
    if (activeOrder?.passenger_phone) {
      window.location.href = `tel:${activeOrder.passenger_phone}`;
    } else {
      message.info("Mijoz raqami yashirilgan");
    }
  };

  // Tugma animatsiyasi
  const btnTouchProps = {
    onMouseDown: (e) => (e.currentTarget.style.transform = "scale(0.96)"),
    onMouseUp: (e) => (e.currentTarget.style.transform = "scale(1)"),
    onTouchStart: (e) => (e.currentTarget.style.transform = "scale(0.96)"),
    onTouchEnd: (e) => (e.currentTarget.style.transform = "scale(1)"),
    style: { transition: "transform 0.1s" },
  };

  // --- 1-HOLAT: AKTIV BUYURTMA (XARITA) ---
  if (activeOrder) {
    const clientPos = parseLatLng(activeOrder.pickup_location) || [42.4619, 59.6166]; // Fallback
    const destPos = parseLatLng(activeOrder.dropoff_location);

    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Xarita qismi */}
        <div style={{ flex: 1, position: "relative" }}>
          <MapContainer
            center={clientPos}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            
            {/* Yo'lovchi */}
            <Marker position={clientPos} icon={clientIcon}>
              <Popup>Yo'lovchi: {activeOrder.pickup_location}</Popup>
            </Marker>
            
            {/* Haydovchi */}
            <SmoothDriverMarker position={driverLoc} />
            
            {/* Manzil (agar bor bo'lsa) */}
            {destPos && (
              <Marker position={destPos}>
                <Popup>Borish: {activeOrder.dropoff_location}</Popup>
              </Marker>
            )}
            
            <RecenterMap lat={clientPos[0]} lng={clientPos[1]} />
          </MapContainer>
        </div>

        {/* Boshqaruv paneli */}
        <div
          style={{
            padding: 25,
            background: "#fff",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.15)",
            borderRadius: "30px 30px 0 0",
            zIndex: 1000,
            position: "relative"
          }}
        >
          <div style={{ width: 60, height: 6, background: '#e0e0e0', borderRadius: 3, margin: '0 auto 20px auto' }} />
          
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
              alignItems: "center",
            }}
          >
            <div style={{ maxWidth: "80%" }}>
              <Tag color={activeOrder.status === "accepted" ? "blue" : activeOrder.status === "arrived" ? "orange" : "green"}>
                {activeOrder.status.toUpperCase()}
              </Tag>
              <Title level={4} style={{ margin: "5px 0", fontWeight: 800 }}>
                {activeOrder.status === "in_progress" ? "Manzilga borilyapti" : "Mijoz kutyapti"}
              </Title>
              <div style={{ display: "flex", alignItems: "center", marginTop: 5 }}>
                <EnvironmentOutlined style={{ color: "#52c41a", marginRight: 5 }} />
                <Text type="secondary" ellipsis style={{maxWidth: 200}}>
                  {activeOrder.pickup_location}
                </Text>
              </div>
            </div>
            <Button
              shape="circle"
              size="large"
              icon={<PhoneOutlined />}
              type="primary"
              onClick={callClient}
              style={{ background: "#52c41a", width: 50, height: 50 }}
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
                fontSize: 18,
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
                fontSize: 18,
                fontWeight: 700,
                ...btnTouchProps.style,
              }}
            >
              KETDIK (BOSHLASH) 🚖
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
                fontSize: 18,
                fontWeight: 700,
                ...btnTouchProps.style,
              }}
            >
              YAKUNLASH ✅
            </Button>
          )}
        </div>
      </div>
    );
  }

  // --- 2-HOLAT: BUYURTMALAR LENTASI (FEED) ---
  return (
    <div style={{ padding: "15px", paddingBottom: "100px", minHeight: "100vh", background: "#f8f9fa" }}>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 800 }}>
        {t?.nearOrders || "Yaqin-atrofdagi buyurtmalar"}
      </Title>

      {loading && orders.length === 0 ? (
        [1, 2, 3].map((i) => (
          <Card key={i} style={{ marginBottom: 15, borderRadius: 24, border: 'none' }}>
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </Card>
        ))
      ) : (
        <List
          dataSource={orders}
          locale={{ emptyText: <Empty description="Hozircha buyurtmalar yo'q" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          renderItem={(item) => (
            <Card
              key={item.id}
              style={{
                marginBottom: 15,
                borderRadius: 24,
                boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
                border: "none",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{position:'absolute', top:0, left:0, width:4, height:'100%', background: item.service_type === 'comfort' ? '#faad14' : '#1890ff'}}></div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15, paddingLeft: 10 }}>
                <Tag color="blue" icon={<CarOutlined />}>
                  {(item.service_type || "taxi").toUpperCase()}
                </Tag>
                <Title level={4} style={{ margin: 0, color: "#52c41a", fontWeight: 800 }}>
                  {Number(item.price || 0).toLocaleString()} so'm
                </Title>
              </div>

              <div style={{ marginBottom: 20, paddingLeft: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <EnvironmentOutlined style={{ color: "#1890ff", fontSize: 18, marginTop: 4 }} />
                  <div>
                    <Text type="secondary" style={{fontSize: 11}}>Qayerdan</Text>
                    <div style={{fontWeight: 600, fontSize: 15}}>{item.pickup_location}</div>
                  </div>
                </div>
                
                {/* Agar borish manzili bo'lsa */}
                {item.dropoff_location && (
                  <>
                    <div style={{ borderLeft: "2px dashed #e0e0e0", height: 15, marginLeft: 9, margin: "0 0 5px 0" }}></div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <EnvironmentOutlined style={{ color: "#ff4d4f", fontSize: 18, marginTop: 4 }} />
                      <div>
                        <Text type="secondary" style={{fontSize: 11}}>Qayerga</Text>
                        <div style={{fontWeight: 600, fontSize: 15}}>
                          {item.dropoff_location.includes("Lat:") ? "Xaritada belgilangan" : item.dropoff_location}
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
                  fontSize: 16,
                  ...btnTouchProps.style,
                }}
                onClick={() => acceptOrder(item.id)}
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