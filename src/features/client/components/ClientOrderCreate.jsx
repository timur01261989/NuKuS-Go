import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Drawer, Input, List, Space, Typography, message, Modal, Rate, Avatar, Tag } from "antd";
import {
  EnvironmentOutlined, SearchOutlined, SwapOutlined, StarFilled, 
  ClockCircleOutlined, WalletOutlined, AimOutlined, SendOutlined, 
  UserOutlined, CloseOutlined, RightOutlined, PhoneOutlined, SafetyOutlined, 
  ShareAltOutlined, StopOutlined, CheckCircleOutlined, InfoCircleOutlined
} from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { playAliceVoice } from "@/utils/AudioPlayer";
import api from "@/utils/apiHelper";
import { supabase } from "@/lib/supabase";

const { Text, Title } = Typography;

/** ---------------- ICONS ---------------- */
// Faqat mashina va boshqa markerlar uchun (Markaziy pin HTML overlay bo'ladi)
const carIcon = L.divIcon({
  html: `<div style="font-size: 24px; transform: rotate(0deg);">🚕</div>`,
  className: "car-marker", iconSize: [30, 30],
});

const pickupMarkerIcon = L.divIcon({
  html: `<div style="width: 12px; height: 12px; background: #000; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 2px #000;"></div>`,
  className: "", iconSize: [12, 12],
});

const destMarkerIcon = L.divIcon({
  html: `<div style="width: 12px; height: 12px; background: #000; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 2px #000;"></div>`,
  className: "", iconSize: [12, 12],
});

/** ---------------- TARIFFS ---------------- */
const TARIFFS = [
  { id: "start", name: "Start", base: 6000, perKm: 1500, eta: "2 daq", img: "🚕" },
  { id: "comfort", name: "Komfort", base: 10000, perKm: 2000, eta: "4 daq", img: "✨" },
  { id: "delivery", name: "Yetkazish", base: 8000, perKm: 1700, eta: "8 daq", img: "📦" },
];

/** ---------------- HELPERS ---------------- */
const fmtMoney = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

// Nominatim (O'zbekiston bilan cheklangan)
async function nominatimReverse(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz`);
    const data = await res.json();
    // Manzilni qisqartirib ko'rsatish (Ko'cha nomi va uy raqami)
    const addr = data.address;
    return `${addr.road || addr.suburb || "Noma'lum joy"}, ${addr.house_number || ""}`;
  } catch { return "Manzil aniqlanmoqda..."; }
}

async function nominatimSearch(q, signal) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=uz&limit=5`, { signal });
    return await res.json();
  } catch { return []; }
}

async function osrmRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const r = data?.routes?.[0];
    return {
      coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceKm: r.distance / 1000
    };
  } catch { return null; }
}

// Xarita markazini kuzatuvchi komponent
function MapController({ onCenterChange, onMoveStart, mode, center }) {
  const map = useMap();
  const movingRef = useRef(false);

  useEffect(() => {
    if (!map) return;
    
    const handleMoveStart = () => {
      movingRef.current = true;
      onMoveStart(true);
    };

    const handleMoveEnd = () => {
      movingRef.current = false;
      onMoveStart(false);
      const c = map.getCenter();
      onCenterChange([c.lat, c.lng]);
    };

    map.on("movestart", handleMoveStart);
    map.on("moveend", handleMoveEnd);

    return () => {
      map.off("movestart", handleMoveStart);
      map.off("moveend", handleMoveEnd);
    };
  }, [map, onCenterChange, onMoveStart]);

  // Mode o'zgarganda xaritani joyiga qaytarish
  useEffect(() => {
    if (center && (mode === "initial" || mode === "picking_dest")) {
      map.flyTo(center, 16, { animate: true, duration: 0.8 });
    }
  }, [mode, center, map]);

  return null;
}

export default function ClientOrderCreate() {
  // Modes: 'initial', 'search_drawer', 'picking_dest', 'preview', 'searching', 'active'
  const [mode, setMode] = useState("initial");
  
  const [pickup, setPickup] = useState({ latlng: [42.4602, 59.6166], address: "Joylashuv aniqlanmoqda..." });
  const [dest, setDest] = useState({ latlng: null, address: "" });
  
  const [mapCenter, setMapCenter] = useState([42.4602, 59.6166]);
  const [isDragging, setIsDragging] = useState(false);
  const [tariff, setTariff] = useState(TARIFFS[0]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);
  
  const [orderId, setOrderId] = useState(null);
  const [driver, setDriver] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Geolokatsiya olish
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      setMapCenter([latitude, longitude]);
      setPickup(p => ({ ...p, latlng: [latitude, longitude] }));
    });
  }, []);

  // Xarita markazi o'zgarganda (Pin ostidagi manzilni olish)
  const handleCenterChange = useCallback(async (latlng) => {
    if (mode === "initial") {
      setPickup(p => ({ ...p, latlng }));
      const addr = await nominatimReverse(latlng[0], latlng[1]);
      setPickup(p => ({ ...p, address: addr }));
    } else if (mode === "picking_dest") {
      setDest(d => ({ ...d, latlng }));
      const addr = await nominatimReverse(latlng[0], latlng[1]);
      setDest(d => ({ ...d, address: addr }));
    }
  }, [mode]);

  // Qidiruv
  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (val.length > 2) {
      const res = await nominatimSearch(val);
      setSearchResults(res);
    }
  };

  // Buyurtma berish (API)
  const handleOrder = async () => {
    setMode("searching");
    try {
      const payload = {
        action: "create", // ⚠️ BU MUHIM (400 xatosi uchun)
        status: "searching",
        price: Math.round(tariff.base + distanceKm * tariff.perKm),
        service_type: tariff.id,
        pickup_location: pickup.address,
        dropoff_location: dest.address || "Haydovchiga aytaman",
        from_lat: pickup.latlng[0],
        from_lng: pickup.latlng[1],
        to_lat: dest.latlng ? dest.latlng[0] : null,
        to_lng: dest.latlng ? dest.latlng[1] : null,
        distance_km: distanceKm
      };

      const res = await api.post("/api/order", payload);
      if (res?.id || res?.orderId) {
        setOrderId(res.id || res.orderId);
        message.success("Buyurtma yuborildi");
      }
    } catch (e) {
      message.error("Xatolik: " + e.message);
      setMode("initial");
    }
  };

  // Marshrutni chizish
  useEffect(() => {
    if (mode === "preview" && pickup.latlng && dest.latlng) {
      osrmRoute(pickup.latlng, dest.latlng).then(res => {
        if (res) {
          setRouteCoords(res.coords);
          setDistanceKm(res.distanceKm);
        }
      });
    }
  }, [mode, pickup.latlng, dest.latlng]);

  // Statusni tekshirish (Polling)
  useEffect(() => {
    if (!orderId || mode !== "searching") return;
    const interval = setInterval(async () => {
      try {
        const res = await api.post("/api/order", { action: "status", orderId });
        const ord = res.order || res.data?.order;
        
        if (ord?.status === "driver_assigned" || ord?.status === "accepted") {
          setDriver(ord.driver || { name: "Aziz", car: "Cobalt", plate: "95A777AA" }); // Test data
          setMode("active");
          playAliceVoice("driver_found");
        }
      } catch {}
    }, 4000);
    return () => clearInterval(interval);
  }, [orderId, mode]);

  return (
    <div className="app-container">
      {/* --- 1. XARITA QISMI --- */}
      <div className="map-layer">
        <MapContainer center={mapCenter} zoom={16} zoomControl={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          
          <MapController 
            center={mode === "picking_dest" ? dest.latlng : pickup.latlng}
            mode={mode}
            onMoveStart={setIsDragging}
            onCenterChange={handleCenterChange}
          />

          {/* Marshrut chizig'i (5-Rasm) */}
          {mode === "preview" && routeCoords.length > 0 && (
            <>
              <Polyline positions={routeCoords} pathOptions={{ color: "#222", weight: 5 }} />
              <Marker position={pickup.latlng} icon={pickupMarkerIcon} />
              <Marker position={dest.latlng} icon={destMarkerIcon} />
            </>
          )}

          {/* Haydovchi mashinasi (7-Rasm) */}
          {mode === "active" && driver && (
            <Marker position={[pickup.latlng[0] - 0.002, pickup.latlng[1] - 0.002]} icon={carIcon} />
          )}
        </MapContainer>

        {/* --- MARKAZIY PIN (OVERLAY) 1 & 4 Rasm --- */}
        {(mode === "initial" || mode === "picking_dest") && (
          <div className={`center-pin ${isDragging ? "lifting" : ""}`}>
            <div className={`pin-body ${mode === "initial" ? "yellow" : "black"}`}>
              {mode === "initial" ? "🙋‍♂️" : "🏁"}
            </div>
            <div className="pin-shadow"></div>
            {/* Vaqt (4-Rasm) */}
            {mode === "picking_dest" && <div className="pin-time">2 daq</div>}
          </div>
        )}

        {/* --- QIDIRUV ANIMATSIYASI 6-Rasm --- */}
        {mode === "searching" && (
          <div className="radar-container">
            <div className="radar-wave"></div>
            <div className="radar-wave delay-1"></div>
            <div className="radar-pin">🙋‍♂️</div>
          </div>
        )}

        {/* Yuqori Manzil Paneli (1-Rasm) */}
        {mode === "initial" && (
          <div className="top-address-card">
            <div className="dot blue"></div>
            <Text ellipsis style={{ flex: 1, fontWeight: 600 }}>{pickup.address}</Text>
            <RightOutlined style={{ color: "#ccc" }} />
          </div>
        )}
      </div>

      {/* --- 2. DRAWER / PASTKI PANELLAR --- */}

      {/* INITIAL (1-Rasm) */}
      {mode === "initial" && (
        <div className="bottom-sheet initial">
          <div className="sheet-handle"></div>
          <div className="input-fake" onClick={() => setMode("search_drawer")}>
            <SearchOutlined style={{ marginRight: 10, color: "#faad14" }} />
            <Text strong>Qayerga borasiz?</Text>
          </div>
          
          <div className="quick-locations">
            {[{name:"Uy", icon:<EnvironmentOutlined/>}, {name:"Ish", icon:<EnvironmentOutlined/>}, {name:"Bozor", icon:<EnvironmentOutlined/>}].map((i, idx) => (
              <div key={idx} className="loc-chip">{i.icon} {i.name}</div>
            ))}
          </div>

          <div className="action-buttons">
            <Button size="large" icon={<SwapOutlined />} style={{ borderRadius: 16, height: 56, width: 56 }} />
            <Button 
              type="primary" 
              size="large" 
              style={{ flex: 1, height: 56, borderRadius: 16, fontWeight: "bold", background: "#3369e7" }}
              onClick={handleOrder}
            >
              BUYURTMA BERISH
            </Button>
          </div>
        </div>
      )}

      {/* QIDIRUV DRAWER (2-3 Rasm) */}
      <Drawer
        open={mode === "search_drawer"}
        placement="bottom"
        height="100%"
        closable={false}
        bodyStyle={{ padding: 0 }}
      >
        <div className="search-drawer-content">
          <div className="search-header">
            <Button type="text" icon={<CloseOutlined />} onClick={() => setMode("initial")} />
            <div className="search-inputs">
              <div className="inp-row">
                <div className="dot blue"></div>
                <Input value={pickup.address} bordered={false} />
              </div>
              <div className="divider"></div>
              <div className="inp-row">
                <div className="dot red"></div>
                <Input 
                  placeholder="Qayerga borasiz?" 
                  bordered={false} 
                  autoFocus 
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                />
                <Button size="small" onClick={() => setMode("picking_dest")}>Xarita</Button>
              </div>
            </div>
          </div>
          <List
            className="search-results"
            dataSource={searchResults}
            renderItem={item => (
              <List.Item onClick={() => {
                setDest({ latlng: [item.lat, item.lon], address: item.display_name });
                setMode("preview");
              }}>
                <List.Item.Meta
                  avatar={<div className="result-icon"><EnvironmentOutlined /></div>}
                  title={item.display_name.split(",")[0]}
                  description={item.display_name.split(",").slice(1).join(",")}
                />
              </List.Item>
            )}
          />
        </div>
      </Drawer>

      {/* XARITADAN TANLASH (4-Rasm) */}
      {mode === "picking_dest" && (
        <div className="picking-dest-footer">
          <Button 
            type="primary" 
            block 
            size="large" 
            style={{ height: 56, borderRadius: 16, background: "#fcb000", color: "#000", fontWeight: "bold" }}
            onClick={() => setMode("preview")}
          >
            TAYYOR
          </Button>
        </div>
      )}

      {/* MARSHRUT VA TARIFLAR (5-Rasm) */}
      {mode === "preview" && (
        <div className="bottom-sheet preview">
          <div className="route-info">
            <div className="route-text">
              <Title level={5} style={{ margin: 0 }}>~12 daq • {distanceKm.toFixed(1)} km</Title>
            </div>
          </div>
          
          <div className="tariffs-scroll">
            {TARIFFS.map(t => (
              <div 
                key={t.id} 
                className={`tariff-card ${tariff.id === t.id ? "active" : ""}`}
                onClick={() => setTariff(t)}
              >
                <div className="t-img">{t.img}</div>
                <div className="t-name">{t.name}</div>
                <div className="t-price">{Math.round(t.base + distanceKm * t.perKm)} so'm</div>
              </div>
            ))}
          </div>

          <div className="payment-row">
            <Button icon={<WalletOutlined />}>Naqd</Button>
            <Button icon={<StarFilled />}>Promo</Button>
          </div>

          <Button 
            type="primary" 
            block 
            size="large" 
            style={{ height: 56, borderRadius: 16, background: "#fcb000", color: "#000", fontWeight: "bold", marginTop: 15 }}
            onClick={handleOrder}
          >
            BUYURTMA BERISH
          </Button>
        </div>
      )}

      {/* QIDIRILMOQDA (6-Rasm) */}
      {mode === "searching" && (
        <div className="bottom-sheet searching">
          <Title level={4}>Yaqin-atrofda 5 mashina</Title>
          <Text type="secondary">Moslarini qidiryapmiz...</Text>
          <div className="search-btns">
            <Button icon={<CloseOutlined />} onClick={() => setMode("initial")}>Bekor qilish</Button>
            <Button icon={<InfoCircleOutlined />}>Tafsilotlar</Button>
          </div>
        </div>
      )}

      {/* ACTIVE (7-8 Rasm) */}
      {mode === "active" && (
        <div className="bottom-sheet active">
          <div className="eta-pill">~2 daq va keladi</div>
          <div className="driver-card">
            <div className="driver-text">
              <Title level={4} style={{ margin: 0 }}>{driver?.name} <StarFilled style={{color:"gold", fontSize:12}}/></Title>
              <Text type="secondary">{driver?.car}</Text>
              <div className="plate-box">{driver?.plate}</div>
            </div>
            <Avatar size={60} icon={<UserOutlined />} />
          </div>
          <div className="action-grid">
            <Button shape="circle" icon={<PhoneOutlined />} size="large" />
            <Button shape="circle" icon={<SafetyOutlined />} size="large" />
            <Button shape="circle" icon={<ShareAltOutlined />} size="large" />
          </div>
          <Button danger block type="text" style={{ marginTop: 15 }} onClick={() => setMode("initial")}>
            Safarni bekor qilish
          </Button>
        </div>
      )}

      {/* --- STYLES --- */}
      <style>{`
        .app-container { height: 100vh; display: flex; flex-direction: column; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .map-layer { flex: 1; position: relative; }
        
        /* Center Pin */
        .center-pin { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%); z-index: 1000; pointer-events: none; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; align-items: center; }
        .center-pin.lifting { transform: translate(-50%, -120%) scale(1.1); }
        .pin-body { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .pin-body.yellow { background: #fcb000; color: #000; }
        .pin-body.black { background: #222; color: #fff; }
        .pin-shadow { width: 10px; height: 3px; background: rgba(0,0,0,0.3); border-radius: 50%; margin-top: 5px; }
        .pin-time { position: absolute; top: -30px; background: #222; color: #fff; padding: 2px 8px; border-radius: 8px; font-size: 12px; font-weight: bold; }

        /* Radar */
        .radar-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 900; }
        .radar-pin { font-size: 32px; position: relative; z-index: 2; }
        .radar-wave { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; border-radius: 50%; background: rgba(252, 176, 0, 0.3); animation: ripple 2s infinite linear; }
        .delay-1 { animation-delay: 0.6s; }
        @keyframes ripple { 0% { width: 20px; height: 20px; opacity: 0.8; } 100% { width: 300px; height: 300px; opacity: 0; } }

        /* Top Address */
        .top-address-card { position: absolute; top: 15px; left: 15px; right: 15px; background: #fff; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 1000; }
        .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .dot.blue { background: #3369e7; } .dot.red { background: #ff4d4f; }

        /* Bottom Sheets */
        .bottom-sheet { background: #fff; padding: 20px; border-radius: 20px 20px 0 0; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); z-index: 1001; position: relative; }
        .sheet-handle { width: 40px; height: 4px; background: #e0e0e0; border-radius: 2px; margin: 0 auto 15px auto; }
        
        .initial .input-fake { background: #f2f2f2; padding: 12px 16px; border-radius: 12px; display: flex; align-items: center; margin-bottom: 15px; cursor: pointer; }
        .quick-locations { display: flex; gap: 10px; overflow-x: auto; margin-bottom: 20px; }
        .loc-chip { background: #fff; border: 1px solid #eee; padding: 6px 12px; border-radius: 16px; font-size: 13px; font-weight: 500; white-space: nowrap; display: flex; align-items: center; gap: 5px; }
        .action-buttons { display: flex; gap: 10px; }

        /* Search Drawer */
        .search-drawer-content { height: 100%; display: flex; flex-direction: column; background: #fff; }
        .search-header { padding: 15px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-start; gap: 10px; }
        .search-inputs { flex: 1; background: #f5f5f5; border-radius: 12px; padding: 5px 10px; }
        .inp-row { display: flex; align-items: center; gap: 10px; height: 40px; }
        .divider { height: 1px; background: #e0e0e0; margin: 0 30px; }
        .result-icon { width: 32px; height: 32px; background: #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #666; }

        /* Picking Dest Footer */
        .picking-dest-footer { position: absolute; bottom: 30px; left: 20px; right: 20px; z-index: 1005; }

        /* Tariffs */
        .tariffs-scroll { display: flex; gap: 10px; overflow-x: auto; margin: 15px 0; padding-bottom: 5px; }
        .tariff-card { min-width: 100px; padding: 10px; border: 1px solid #f0f0f0; border-radius: 12px; text-align: center; transition: 0.2s; cursor: pointer; }
        .tariff-card.active { background: #fff8e1; border-color: #fcb000; box-shadow: 0 4px 12px rgba(252, 176, 0, 0.15); }
        .t-img { font-size: 30px; margin-bottom: 5px; }
        .t-name { font-weight: 700; font-size: 13px; }
        .t-price { font-size: 12px; color: #666; }

        /* Active Driver */
        .eta-pill { background: #fcb000; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 13px; display: inline-block; margin-bottom: 15px; }
        .driver-card { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .plate-box { background: #f5f5f5; border: 1px solid #ddd; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; display: inline-block; margin-top: 4px; }
        .action-grid { display: flex; justify-content: space-around; }

        .search-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }
      `}</style>
    </div>
  );
}