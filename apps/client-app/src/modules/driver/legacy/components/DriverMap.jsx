import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, message, Card, Typography } from "antd";
import { 
  PhoneOutlined, 
  EnvironmentOutlined, 
  CheckCircleOutlined, 
  CarOutlined, 
  AimOutlined 
} from "@ant-design/icons";
import NewOrderModal from "./NewOrderModal";

import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import api from "@/modules/shared/utils/apiHelper";
import { supabase } from "@/services/supabase/supabaseClient";
import { playAliceVoice } from "@/modules/shared/utils/AudioPlayer"; // Ovozli yordamchi

const { Text, Title } = Typography;

/**
 * DriverMap.jsx (PRO Version)
 * - Radar (Buyurtma qidirish)
 * - Navigation (OSRM yo'nalish chizish)
 * - Status Management (Arrived -> Start -> Complete)
 * - Audio Guidance
 */

// --- ICONS ---
const driverIcon = L.divIcon({
  html: '<div style="font-size:32px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">🚖</div>',
  className: "drv-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const clientIcon = L.divIcon({
  html: '<div style="font-size:32px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">🙋‍♂️</div>',
  className: "cl-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const destIcon = L.divIcon({
  html: '<div style="font-size:32px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">🏁</div>',
  className: "dst-icon",
  iconSize: [32, 32],
  iconAnchor: [5, 32],
});

// --- HELPER: Xaritani boshqarish ---
function MapController({ center, routeCoords, focusTrigger }) {
  const map = useMap();
  
  // 1. Agar yo'nalish (marshrut) bo'lsa, xaritani shunga moslash
  useEffect(() => {
    if (routeCoords && routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    }
  }, [routeCoords, map]);

  // 2. Tugma bosilganda markazga qaytish
  useEffect(() => {
    if (focusTrigger && center) {
      map.flyTo(center, 16, { animate: true, duration: 0.8 });
    }
  }, [focusTrigger, center, map]);

  return null;
}

// --- HELPER: Marshrut chizish (OSRM) ---
async function fetchOsrmRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch (e) {
    console.warn("OSRM xatosi:", e);
  }
  return [from, to]; // Fallback: to'g'ri chiziq
}

export default function DriverMap() {
  const [isOnline, setIsOnline] = useState(false);
  const [myLocation, setMyLocation] = useState([42.4619, 59.6166]); // Nukus default
  const lastLocRef = useRef(myLocation);

  // Order State
  const [incomingOrder, setIncomingOrder] = useState(null); // Taklif qilinayotgan
  const [currentOrder, setCurrentOrder] = useState(null);   // Qabul qilingan
  const [showModal, setShowModal] = useState(false);
  
  // Navigation
  const [routeCoords, setRouteCoords] = useState([]);
  const routeUpdateTimer = useRef(null); // Debounce uchun
  const [focusTrigger, setFocusTrigger] = useState(0); // Xaritani markazlashtirish uchun signal

  // 1. Geolokatsiyani kuzatish
  useEffect(() => {
    if (!navigator.geolocation) return message.error("GPS ishlamaydi");
    
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newLoc = [latitude, longitude];
        setMyLocation(newLoc);
        lastLocRef.current = newLoc;
      },
      (err) => console.warn(err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // 2. Buyurtma so'rash (Polling)
  useEffect(() => {
    if (!isOnline || currentOrder) return; // Agar band bo'lsa qidirmaymiz

    const interval = setInterval(async () => {
      try {
        const [lat, lng] = lastLocRef.current;
        const { data: ses } = await supabase.auth.getSession();
        const driver_id = ses?.session?.user?.id;
        if (!driver_id) return;
        const res = await api.post("/api/dispatch", {
          action: "driver_ping",
          driver_id,
          lat,
          lng,
          status: "searching"
        });

        if (res?.new_order) {
          setIncomingOrder(res.new_order);
          setShowModal(true);
          // Ovoz NewOrderModal.jsx useEffect orqali o'zi chaladi (ikki marta chalmasligi uchun bu yerda yo'q)
        }
      } catch (e) {
        console.warn("Ping error", e);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOnline, currentOrder]);

  // 3. Marshrutni yangilash (Navigatsiya)
  useEffect(() => {
    if (!currentOrder || !myLocation) {
      setRouteCoords([]);
      return;
    }

    // Oldingi debounce timeoutni bekor qilamiz
    if (routeUpdateTimer.current) clearTimeout(routeUpdateTimer.current);

    // 3 soniya kutib marshrut yangilaymiz (GPS har o'zgarishida emas)
    routeUpdateTimer.current = setTimeout(async () => {
      let target = null;
      // Agar status "accepted" bo'lsa -> Mijozga boramiz
      if (currentOrder.status === "accepted") {
        target = [parseFloat(currentOrder.from_lat), parseFloat(currentOrder.from_lng)];
      } 
      // Agar status "in_progress" bo'lsa -> Manzilga boramiz
      else if (currentOrder.status === "in_progress" && currentOrder.to_lat) {
        target = [parseFloat(currentOrder.to_lat), parseFloat(currentOrder.to_lng)];
      }

      if (target && !isNaN(target[0])) {
        const coords = await fetchOsrmRoute(myLocation, target);
        setRouteCoords(coords);
      }
    }, 3000);

    return () => {
      if (routeUpdateTimer.current) clearTimeout(routeUpdateTimer.current);
    };
  }, [currentOrder, myLocation]); // Harakatlanganda marshrut yangilanadi (debounce bilan)

  // --- ACTIONS ---

  const handleAccept = async () => {
    if (!incomingOrder) return;
    try {
      setShowModal(false);
      const res = await api.post("/api/offer", { 
        action: "accept", 
        orderId: incomingOrder.id 
      });

      if (res.success || res.order) {
        setCurrentOrder(res.order || incomingOrder);
        setIncomingOrder(null);
        setRouteCoords([]); // Marshrut qayta hisoblanadi
        message.success("Qabul qilindi!");
        playAliceVoice("order_accepted"); // 🔊
      } else {
        message.warning("Ulgurmadingiz, buyurtma olib bo'lindi");
        setIncomingOrder(null);
      }
    } catch (e) {
      message.error("Xatolik yuz berdi");
    }
  };

  const handleDecline = async () => {
    setShowModal(false);
    setIncomingOrder(null);
    await api.post("/api/offer", { action: "decline", orderId: incomingOrder?.id });
  };

  const updateStatus = async (newStatus) => {
    if (!currentOrder) return;
    try {
      const res = await api.post("/api/order", { 
        action: "update_status", 
        orderId: currentOrder.id, 
        status: newStatus 
      });

      if (res.success) {
        setCurrentOrder(prev => ({ ...prev, status: newStatus }));
        
        if (newStatus === "arrived") {
          message.success("Mijozga xabar ketdi");
          playAliceVoice("arrived"); // 🔊 "Manzilga yetib keldingiz"
        } else if (newStatus === "in_progress") {
          message.success("Safar boshlandi");
          playAliceVoice("start_trip"); // 🔊 "Harakatni boshlaymiz"
        } else if (newStatus === "completed") {
          message.success(`Yakunlandi! Summa: ${res.price || currentOrder.price} so'm`);
          playAliceVoice("completed"); // 🔊 "Safar tugadi"
          setCurrentOrder(null); // Bo'shatish
          setRouteCoords([]);
        }
      }
    } catch (e) {
      message.error("Internet xatosi");
    }
  };

  // --- RENDERING ---

  // Mijoz va Manzil koordinatalari (xavfsiz olish)
  const pickupPos = currentOrder ? [parseFloat(currentOrder.from_lat), parseFloat(currentOrder.from_lng)] : null;
  const destPos = currentOrder && currentOrder.to_lat ? [parseFloat(currentOrder.to_lat), parseFloat(currentOrder.to_lng)] : null;

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
      
      {/* 1. XARITA */}
      <div style={{ flex: 1 }}>
        <MapContainer center={myLocation} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          
          <MapController center={myLocation} routeCoords={routeCoords} focusTrigger={focusTrigger} />

          {/* Markerlar */}
          <Marker position={myLocation} icon={driverIcon} />
          {pickupPos && !isNaN(pickupPos[0]) && <Marker position={pickupPos} icon={clientIcon} />}
          {destPos && !isNaN(destPos[0]) && <Marker position={destPos} icon={destIcon} />}

          {/* Marshrut chizig'i */}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: "#1890ff", weight: 6 }} />}
        </MapContainer>
      </div>

      {/* 2. TUGMALAR (Online/Offline & Locate Me) */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 900, display: "flex", flexDirection: "column", gap: 10 }}>
        <Button 
          shape="circle" 
          size="large" 
          icon={<AimOutlined />} 
          onClick={() => setFocusTrigger(t => t + 1)} 
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} 
        />
        {!currentOrder && (
          <Button 
            type={isOnline ? "primary" : "default"} 
            danger={isOnline}
            style={{ fontWeight: "bold", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
            onClick={() => setIsOnline(!isOnline)}
          >
            {isOnline ? "OFFLINE" : "ONLINE"}
          </Button>
        )}
      </div>

      {/* 3. PASTKI PANEL (Status Boshqaruvi) */}
      {currentOrder && (
        <div style={{
          padding: 20, 
          background: "white", 
          borderTopLeftRadius: 24, 
          borderTopRightRadius: 24, 
          boxShadow: "0 -5px 20px rgba(0,0,0,0.1)",
          zIndex: 1000
        }}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom: 15}}>
            <div>
              <Title level={4} style={{margin:0}}>
                {currentOrder.status === 'in_progress' ? 'Manzilga borilyapti' : 'Mijoz oldiga'}
              </Title>
              <Text type="secondary">
                {currentOrder.status === 'in_progress' ? currentOrder.dropoff_location : currentOrder.pickup_location}
              </Text>
            </div>
            <Button
              shape="circle"
              icon={<PhoneOutlined />}
              size="large"
              type="primary"
              disabled={!currentOrder.passenger_phone}
              onClick={() => {
                if (currentOrder.passenger_phone) {
                  window.location.href = `tel:${currentOrder.passenger_phone}`;
                } else {
                  // message import orqali chaqirilgan
                  message.warning("Telefon raqami mavjud emas");
                }
              }}
            />
          </div>

          {/* STATUS TUGMALARI */}
          {currentOrder.status === "accepted" && (
            <Button type="primary" block size="large" onClick={() => updateStatus("arrived")} style={{height: 55, borderRadius: 16, fontSize: 18, fontWeight: 700}}>
              YETIB KELDIM 🏁
            </Button>
          )}
          {currentOrder.status === "arrived" && (
            <Button type="primary" block size="large" onClick={() => updateStatus("in_progress")} style={{height: 55, borderRadius: 16, fontSize: 18, fontWeight: 700, background: '#faad14'}}>
              BOSHLASH (KETDIK) 🚖
            </Button>
          )}
          {currentOrder.status === "in_progress" && (
            <Button type="primary" danger block size="large" onClick={() => updateStatus("completed")} style={{height: 55, borderRadius: 16, fontSize: 18, fontWeight: 700}}>
              YAKUNLASH ✅
            </Button>
          )}
        </div>
      )}

      {/* 4. MODAL (Yangi buyurtma) */}
      {showModal && incomingOrder && (
        <NewOrderModal
          order={incomingOrder}
          onAccept={handleAccept}
          onDecline={handleDecline}
          visible={showModal}
        />
      )}
    </div>
  );
}