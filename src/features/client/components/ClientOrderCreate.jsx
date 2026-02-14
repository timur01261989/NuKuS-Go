import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Drawer, Input, List, Space, Typography, message, Modal, Rate, Avatar, Tag } from "antd";
import {
  EnvironmentOutlined, SearchOutlined, SwapOutlined, StarFilled, 
  ClockCircleOutlined, WalletOutlined, AimOutlined, SendOutlined, 
  UserOutlined, CloseOutlined, RightOutlined, PhoneOutlined, SafetyOutlined, 
  ShareAltOutlined, StopOutlined, CheckCircleOutlined
} from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { playAliceVoice } from "@/utils/AudioPlayer";
import api from "@/utils/apiHelper";
import { supabase } from "@/lib/supabase";

const { Text, Title } = Typography;

/** ---------------- ICONS ---------------- */
const pickupIcon = L.divIcon({
  html: `<div class="pin-container"><div class="pin-yellow-man">🙋‍♂️</div></div>`,
  className: "custom-div-icon", iconSize: [50, 50], iconAnchor: [25, 50],
});

const destIcon = L.divIcon({
  html: `<div class="pin-container"><div class="pin-target">🎯</div></div>`,
  className: "custom-div-icon", iconSize: [50, 50], iconAnchor: [25, 50],
});

// Mashina ikonkasi (Yandex-like)
const carIcon = L.divIcon({
  html: `<div class="car-marker">🚕</div>`,
  className: "", iconSize: [30, 30],
});

/** ---------------- TARIFFS ---------------- */
const TARIFFS = [
  { id: "start", name: "Start", base: 6000, perKm: 1500, eta: "2 daq", img: "🚕" },
  { id: "comfort", name: "Komfort", base: 7500, perKm: 2000, eta: "4 daq", img: "✨" },
  { id: "delivery", name: "Yetkazish", base: 4500, perKm: 1200, eta: "8 daq", img: "📦" },
];

/** ---------------- HELPERS ---------------- */
async function nominatimReverse(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { "Accept-Language": "uz" }
    });
    const data = await res.json();
    return data?.display_name?.split(",")[0] + ", " + (data?.display_name?.split(",")[1] || "");
  } catch { return "Noma'lum ko'cha"; }
}

async function osrmRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const r = data?.routes?.[0];
    return {
      coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceKm: r.distance / 1000,
      durationMin: r.duration / 60
    };
  } catch { return null; }
}

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 16, { animate: true }); }, [center, map]);
  return null;
}

function CenterTracker({ onCenter, setIsDragging }) {
  const map = useMap();
  useEffect(() => {
    map.on("movestart", () => setIsDragging(true));
    map.on("moveend", async () => {
      setIsDragging(false);
      const c = map.getCenter();
      onCenter([c.lat, c.lng]);
    });
  }, [map, onCenter, setIsDragging]);
  return null;
}

export default function ClientOrderCreate() {
  // Mode: 'initial', 'destSelection', 'destPinDrop', 'routePreview', 'searching', 'enRoute'
  const [mode, setMode] = useState("initial");
  const [userLoc, setUserLoc] = useState([42.4602, 59.6166]);
  const [pickup, setPickup] = useState({ latlng: [42.4602, 59.6166], address: "Manzil aniqlanmoqda..." });
  const [dest, setDest] = useState({ latlng: null, address: "" });
  const [isDragging, setIsDragging] = useState(false);
  const [tariff, setTariff] = useState(TARIFFS[0]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [driver, setDriver] = useState(null);

  // Markaziy pin manzilini yangilash
  const handleMapMove = async (latlng) => {
    const addr = await nominatimReverse(latlng[0], latlng[1]);
    if (mode === "initial") setPickup({ latlng, address: addr });
    if (mode === "destPinDrop") setDest({ latlng, address: addr });
  };

  // Buyurtma berish mantiqi
  const handleOrder = async () => {
    if (mode === "routePreview" || mode === "initial") {
      setMode("searching");
      try {
        const res = await api.post("/api/order", {
          action: "create",
          pickup_location: pickup.address,
          dropoff_location: dest.address || "Manzil belgilanmagan",
          from_lat: pickup.latlng[0], from_lng: pickup.latlng[1],
          to_lat: dest.latlng ? dest.latlng[0] : null, to_lng: dest.latlng ? dest.latlng[1] : null,
          price: Math.round(tariff.base + distanceKm * tariff.perKm),
          status: "searching"
        });
        setOrderId(res.id);
      } catch { message.error("Zakaz berishda xato"); setMode("routePreview"); }
    }
  };

  // Marshrut chizish
  useEffect(() => {
    if (pickup.latlng && dest.latlng && mode === "routePreview") {
      osrmRoute(pickup.latlng, dest.latlng).then(res => {
        if (res) { setRouteCoords(res.coords); setDistanceKm(res.distanceKm); }
      });
    }
  }, [pickup.latlng, dest.latlng, mode]);

  // Polling (Haydovchi qabul qilishini kutish)
  useEffect(() => {
    if (!orderId || mode !== "searching") return;
    const interval = setInterval(async () => {
      const res = await api.post("/api/order", { action: "status", orderId });
      if (res.order?.status === "accepted") {
        setDriver(res.order.driver);
        setOrderStatus("accepted");
        setMode("enRoute");
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [orderId, mode]);

  return (
    <div className="yandex-container">
      {/* 1. XARITA QISMI */}
      <div className="map-wrapper">
        <MapContainer center={userLoc} zoom={16} zoomControl={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <FlyTo center={mode === "initial" ? pickup.latlng : mode === "destPinDrop" ? dest.latlng : null} />
          
          <CenterTracker 
            setIsDragging={setIsDragging} 
            onCenter={handleMapMove} 
            enabled={mode === "initial" || mode === "destPinDrop"} 
          />

          {/* Marshrut chizig'i (Image 5 & 7) */}
          {routeCoords.length > 0 && mode !== "initial" && (
            <Polyline positions={routeCoords} pathOptions={{ color: "#00C853", weight: 6 }} />
          )}

          {/* Haydovchi mashinasi (Image 7) */}
          {mode === "enRoute" && driver?.lat && (
             <Marker position={[driver.lat, driver.lng]} icon={carIcon} />
          )}
        </MapContainer>

        {/* Markaziy Pin Animatsiyasi (Image 1 & 4) */}
        {(mode === "initial" || mode === "destPinDrop") && (
          <div className={`center-pin-overlay ${isDragging ? "lifting" : ""}`}>
            <div className={mode === "initial" ? "yellow-circle-man" : "target-circle"}>
               {mode === "initial" ? "🙋‍♂️" : "🎯"}
            </div>
            <div className="pin-shadow"></div>
          </div>
        )}

        {/* Searching Animatsiyasi (Image 6) */}
        {mode === "searching" && (
          <div className="searching-animation">
            <div className="pulse-wave"></div>
            <div className="pulse-wave delayed"></div>
            <div className="searching-man">🙋‍♂️</div>
          </div>
        )}

        {/* Yuqori Panel (Image 1) */}
        {mode === "initial" && (
          <div className="top-ui">
            <div className="address-display">
               <div className="dot blue"></div>
               <Text strong>{pickup.address}</Text>
            </div>
          </div>
        )}
      </div>

      {/* 2. DRAWER / BOTTOM SHEETS */}
      
      {/* MODE: INITIAL (Image 1) */}
      {mode === "initial" && (
        <div className="bottom-panel-initial">
          <Button className="dest-btn-long" icon={<SearchOutlined />} onClick={() => setMode("destSelection")}>
            Qayerga borasiz?
          </Button>
          <div className="action-row">
             <Button icon={<SwapOutlined />} className="round-btn" />
             <Button type="primary" className="order-now-blue" onClick={handleOrder}>BUYURTMA BERISH</Button>
          </div>
        </div>
      )}

      {/* MODE: DEST SELECTION (Image 2 & 3) */}
      <Drawer
        open={mode === "destSelection"}
        placement="bottom"
        height="100%"
        closable={false}
        className="dest-drawer"
      >
        <div className="drawer-header-custom">
           <Button icon={<CloseOutlined />} type="text" onClick={() => setMode("initial")} />
           <div className="input-group">
              <div className="input-item">
                <div className="dot blue"></div>
                <Input value={pickup.address} readOnly />
              </div>
              <div className="input-item">
                <div className="dot red"></div>
                <Input 
                  placeholder="Qayerga borasiz?" 
                  autoFocus 
                  suffix={<Button size="small" onClick={() => setMode("destPinDrop")}>Xarita</Button>} 
                />
              </div>
           </div>
        </div>
        <List
          className="recent-list"
          dataSource={seedPlaces}
          renderItem={item => (
            <List.Item onClick={() => { setDest({ latlng: [item.lat, item.lng], address: item.label }); setMode("routePreview"); }}>
               <EnvironmentOutlined /> {item.label}
            </List.Item>
          )}
        />
      </Drawer>

      {/* MODE: DEST PIN DROP (Image 4) */}
      {mode === "destPinDrop" && (
        <div className="dest-pin-footer">
          <Card className="price-preview-mini">
            <Text strong>{fmtMoney(tariff.base)} so'm</Text>
          </Card>
          <Button type="primary" block className="ready-btn" onClick={() => setMode("routePreview")}>TAYYOR</Button>
        </div>
      )}

      {/* MODE: ROUTE PREVIEW (Image 5) */}
      {mode === "routePreview" && (
        <div className="route-preview-panel">
          <div className="route-details">
            <div className="addr-row"><div className="dot blue"></div> {pickup.address}</div>
            <div className="addr-row"><div className="dot red"></div> {dest.address} <Button type="link" onClick={() => setMode("destPinDrop")}>O'zgartirish</Button></div>
          </div>
          <div className="tariff-list">
            {TARIFFS.map(t => (
              <div key={t.id} className={`tariff-card ${tariff.id === t.id ? "active" : ""}`} onClick={() => setTariff(t)}>
                <div className="t-icon">{t.img}</div>
                <div className="t-name">{t.name}</div>
                <div className="t-price">{fmtMoney(t.base + distanceKm * t.perKm)}</div>
              </div>
            ))}
          </div>
          <Button type="primary" block className="order-final-btn" onClick={handleOrder}>BUYURTMA BERISH</Button>
        </div>
      )}

      {/* MODE: SEARCHING (Image 6) */}
      {mode === "searching" && (
        <div className="searching-panel">
          <Title level={4}>Yaqin-atrofda 5 dan ortiq mas...</Title>
          <Text type="secondary">Moslarini qidiryapmiz</Text>
          <div className="search-actions">
            <Button icon={<CloseOutlined />} onClick={() => setMode("initial")}>Safarni bekor qilish</Button>
            <Button>Tafsilotlar</Button>
          </div>
        </div>
      )}

      {/* MODE: EN ROUTE (Image 7 & 8) - Haydovchi kelmoqda */}
      {mode === "enRoute" && (
        <div className="driver-panel">
          <div className="eta-badge">~2 daq va keladi</div>
          <div className="driver-info-main">
             <div className="d-text">
                <Title level={4} style={{margin:0}}>Haydovchi ★4.83</Title>
                <Text>Oq Chevrolet Cobalt • <Tag color="default">95S703RA</Tag></Text>
             </div>
             <Avatar size={64} src={driver?.photo_url} icon={<UserOutlined />} />
          </div>
          <div className="quick-actions">
             <Button icon={<PhoneOutlined />}>Aloqa</Button>
             <Button icon={<SafetyOutlined />}>Xavfsizlik</Button>
             <Button icon={<ShareAltOutlined />}>Ulashish</Button>
          </div>
          <div className="trip-details-scroll">
             <div className="detail-item"><div className="dot blue"></div> {pickup.address}</div>
             <div className="detail-item"><div className="dot red"></div> {dest.address}</div>
             <Button danger block type="text" className="cancel-red-btn" onClick={() => setMode("initial")}>Safarni bekor qilish</Button>
          </div>
        </div>
      )}

      <style>{`
        .yandex-container { height: 100vh; display: flex; flex-direction: column; background: #f0f0f0; overflow: hidden; }
        .map-wrapper { flex: 1; position: relative; }
        
        /* Markaziy Pin Animatsiyasi */
        .center-pin-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%); z-index: 1000; pointer-events: none; transition: 0.2s ease; }
        .center-pin-overlay.lifting { transform: translate(-50%, -120%) scale(1.1); }
        .yellow-circle-man { width: 50px; height: 50px; background: #FFD400; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 3px solid #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .target-circle { width: 50px; height: 50px; background: #111; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 3px solid #fff; }
        .pin-shadow { width: 10px; height: 4px; background: rgba(0,0,0,0.2); border-radius: 50%; margin: 5px auto; transition: 0.2s; }
        .lifting .pin-shadow { transform: scale(1.5); opacity: 0.3; }

        /* Searching Animatsiya */
        .searching-animation { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; }
        .pulse-wave { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: rgba(255, 212, 0, 0.4); border-radius: 50%; animation: pulse 2s infinite; }
        .pulse-wave.delayed { animation-delay: 1s; }
        @keyframes pulse { 0% { width: 20px; height: 20px; opacity: 1; } 100% { width: 300px; height: 300px; opacity: 0; } }

        /* Panellar */
        .bottom-panel-initial { padding: 20px; background: #fff; border-radius: 20px 20px 0 0; box-shadow: 0 -5px 20px rgba(0,0,0,0.1); z-index: 1001; }
        .dest-btn-long { width: 100%; height: 50px; border-radius: 12px; background: #f5f5f5; border: none; text-align: left; font-size: 16px; margin-bottom: 15px; }
        .order-now-blue { flex: 1; height: 50px; border-radius: 12px; background: #1890ff; font-weight: bold; }
        .action-row { display: flex; gap: 10px; }
        .round-btn { height: 50px; width: 50px; border-radius: 12px; }

        .route-preview-panel { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; padding: 20px; border-radius: 24px 24px 0 0; z-index: 1002; }
        .tariff-list { display: flex; gap: 10px; overflow-x: auto; margin: 15px 0; padding-bottom: 10px; }
        .tariff-card { min-width: 100px; padding: 10px; border: 1px solid #eee; border-radius: 16px; text-align: center; }
        .tariff-card.active { border-color: #FFD400; background: #fffdf0; }
        
        .driver-panel { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; padding: 20px; border-radius: 24px 24px 0 0; z-index: 1005; max-height: 80vh; overflow-y: auto; }
        .eta-badge { background: #FFD400; padding: 5px 15px; border-radius: 20px; font-weight: bold; width: fit-content; margin-bottom: 10px; }
        .cancel-red-btn { color: #ff4d4f; font-weight: bold; margin-top: 20px; }

        .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 10px; }
        .dot.blue { background: #1890ff; }
        .dot.red { background: #ff4d4f; }
      `}</style>
    </div>
  );
}

const seedPlaces = [
  { label: "Allayar Dosnazarov ko‘chasi, 3/1", lat: 42.4615, lng: 59.6109 },
  { label: "Spartak Stadium, Bustansaray ko‘chasi", lat: 42.4629, lng: 59.6232 },
  { label: "Mega Nukus", lat: 42.4502, lng: 59.6120 },
];