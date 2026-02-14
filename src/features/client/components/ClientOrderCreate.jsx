import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {Card, Button, Typography, Avatar, message, Badge, Progress, Input, Space, Divider, Modal, List} from 'antd';
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  UserOutlined,
  MessageOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  StarFilled,
  SafetyOutlined,
  MenuOutlined,
  WalletOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';

import { supabase } from "../../../lib/supabase";
import ChatComponent from '../../chat/components/ChatComponent';
import RatingModal from '../../shared/components/RatingModal';

const { Text, Title } = Typography;

/** ---------------- MAP ICONS ---------------- */
const userIcon = L.divIcon({
  html: `<div class="user-marker-pulse"></div>`,
  className: 'custom-user-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const carIcon = L.divIcon({
  html: `<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚖</div>`,
  className: 'smooth-car-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

/** ---------------- TARIFFS ---------------- */
const TARIFFS = [
  { id: 'start', name: 'Start', basePrice: 6000, time: '3 min', color: '#FFD400' },
  { id: 'comfort', name: 'Komfort', basePrice: 10000, time: '5 min', color: '#1890ff' },
  { id: 'delivery', name: 'Yetkazish', basePrice: 8000, time: '8 min', color: '#52c41a' },
];

/** ---------------- HELPERS ---------------- */
function MapFlyTo({ center, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { animate: true, duration: 1.5 });
  }, [center, map, zoom]);
  return null;
}

function RoutingMachine({ from, to, active }) {
  const map = useMap();
  const controlRef = useRef(null);

  useEffect(() => {
    if (!map || !from || !to || !active) {
      if (controlRef.current) map.removeControl(controlRef.current);
      return;
    }
    controlRef.current = L.Routing.control({
      waypoints: [L.latLng(from), L.latLng(to)],
      lineOptions: { styles: [{ color: '#000', weight: 5, opacity: 0.6 }] },
      createMarker: () => null,
      addWaypoints: false,
      show: false,
      fitSelectedRoutes: true,
      router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' })
    }).addTo(map);
    return () => { if (controlRef.current) map.removeControl(controlRef.current); };
  }, [map, from, to, active]);
  return null;
}

export default function ClientOrderCreate({ onBack }) {
  // --- STATES ---
  const [mode, setMode] = useState('main'); // main, searching, coming, arrived, ride, completed
  const [userLoc, setUserLoc] = useState([42.4619, 59.6166]); // Nukus
  const [destLoc, setDestLoc] = useState(null);
  const [pickupAddr, setPickupAddr] = useState("Hozirgi joylashuv...");
    const [destAddr, setDestAddr] = useState("");
  const [destSearchVisible, setDestSearchVisible] = useState(false);
  const [destQuery, setDestQuery] = useState('');
  const [destResults, setDestResults] = useState([]);
const [preStep, setPreStep] = useState('pick_dest'); // pick_dest | confirm
const [cancelReasonVisible, setCancelReasonVisible] = useState(false);
const [cancelReason, setCancelReason] = useState('');
  const [selectedTariff, setSelectedTariff] = useState(TARIFFS[0]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);

  // Modals & UI
  const [chatVisible, setChatVisible] = useState(false);
  const [ratingVisible, setRatingVisible] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(p);
        const addr = await reverseGeocode(p);
        setPickupAddr(addr);
      });
    }
    checkExistingOrder();
  }, []);

  const reverseGeocode = async (loc) => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc[0]}&lon=${loc[1]}`);
      const d = await r.json();
      return d.display_name.split(',')[0] + ", " + (d.display_name.split(',')[1] || "");
    } catch { return "Nukus shaxri"; }
  };

const haversineKm = (a, b) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
};

const estimateEtaMin = useMemo(() => {
  if (!destLoc) return null;
  const km = haversineKm(userLoc, destLoc);
  // Shaharda o'rtacha tezlik ~22 km/soat
  const minutes = Math.max(3, Math.round((km / 22) * 60));
  return minutes;
}, [userLoc, destLoc]);

const openDestSearch = () => {
  setDestSearchVisible(true);
  setDestQuery(destAddr || '');
  setDestResults([]);
};

const searchDestination = async (q) => {
  setDestQuery(q);
  if (!q || q.trim().length < 3) {
    setDestResults([]);
    return;
  }
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=7&q=${encodeURIComponent(q)}`;
    const r = await fetch(url);
    const d = await r.json();
    setDestResults(Array.isArray(d) ? d : []);
  } catch (e) {
    console.error(e);
    setDestResults([]);
  }
};

const chooseDestination = async (item) => {
  const loc = [parseFloat(item.lat), parseFloat(item.lon)];
  setDestLoc(loc);
  setDestAddr(item.display_name);
  setDestSearchVisible(false);
  setPreStep('confirm');
};

  const checkExistingOrder = async () => {
    const activeId = localStorage.getItem('activeOrderId');
    if (!activeId) return;
    const { data } = await supabase.from('orders').select('*, drivers(*)').eq('id', activeId).single();
    if (data && !['completed', 'cancelled'].includes(data.status)) {
      setCurrentOrder(data);
      syncStatus(data.status, data);
    }
  };

  // --- REALTIME ---
  useEffect(() => {
    if (!currentOrder?.id) return;
    const sub = supabase.channel(`live-${currentOrder.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${currentOrder.id}` }, (p) => {
        syncStatus(p.new.status, p.new);
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [currentOrder]);

  useEffect(() => {
    if (!driver?.id) return;
    const sub = supabase.channel(`gps-${driver.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drivers', filter: `id=eq.${driver.id}` }, (p) => {
        if (p.new.lat) setDriverLoc([p.new.lat, p.new.lng]);
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [driver]);

  const syncStatus = (status, data) => {
    if (status === 'searching') setMode('searching');
    if (status === 'accepted') { setMode('coming'); setDriver(data.drivers); }
    if (status === 'arrived') setMode('arrived');
    if (status === 'in_progress') setMode('ride');
    if (status === 'completed') { setMode('completed'); setRatingVisible(true); }
  };

  // --- ACTIONS ---
  const handleOrder = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('orders').insert([{
      client_id: user.id,
      status: 'searching',
      price: selectedTariff.basePrice,
      service_type: selectedTariff.id,
      pickup_location: pickupAddr,
      dropoff_location: destAddr || "Belgilanmagan manzil",
      from_lat: userLoc[0], from_lng: userLoc[1],
      to_lat: destLoc ? destLoc[0] : userLoc[0], to_lng: destLoc ? destLoc[1] : userLoc[1]
    }]).select().single();

    if (!error) {
      setCurrentOrder(data);
      localStorage.setItem('activeOrderId', data.id);
      setMode('searching');
    }
  };

  const cancelOrder = async () => {
  // Videodagidek: avval sababini so'raymiz
  setCancelReasonVisible(true);
};

const confirmCancelOrder = async () => {
  if (!currentOrder?.id) {
    message.error("Buyurtma topilmadi");
    setCancelReasonVisible(false);
    return;
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', cancel_reason: cancelReason || null })
    .eq('id', currentOrder.id);

  if (error) {
    console.error(error);
    message.error("Bekor qilishda xatolik");
    return;
  }

  localStorage.removeItem('activeOrderId');
  setCurrentOrder(null);
  setDriver(null);
  setDriverLoc(null);
  setMode('main');
  setPreStep('pick_dest');
  setDestLoc(null);
  setDestAddr('');
  setCancelReason('');
  setCancelReasonVisible(false);
};


  return (
    <div className="yandex-container">
      {/* MAP SECTION */}
      <div className={`map-wrapper mode-${mode}`}>
        <MapContainer center={userLoc} zoom={16} zoomControl={false} style={{ height: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <MapFlyTo center={mode === 'coming' && driverLoc ? driverLoc : userLoc} />
          
          <Marker position={userLoc} icon={userIcon} />
          {destLoc && <Marker position={destLoc} />}
          {driverLoc && <Marker position={driverLoc} icon={carIcon} />}

          <RoutingMachine from={userLoc} to={destLoc} active={mode === 'main' && !!destLoc} />
        </MapContainer>

        <div className="top-nav">
          <Button icon={<MenuOutlined />} shape="circle" onClick={onBack} />
          {mode === 'main' && (
  <div className="content-fade">
    {/* PICKUP + DEST (videodagidek) */}
    <div className="address-inputs">
      <div className="input-row">
        <div className="dot from"></div>
        <div className="addr-text">{pickupAddr}</div>
      </div>

      <Divider style={{ margin: '8px 0' }} />

      <div className="input-row highlight" onClick={openDestSearch}>
        <div className="dot to"></div>
        <div className="addr-text placeholder">
          {destAddr ? destAddr : "Qayerga borasiz?"}
        </div>
        <SearchOutlined style={{ opacity: 0.6 }} />
      </div>
    </div>

    {/* Videoda: dest tanlangach tarif + zakaz */}
    {destLoc ? (
      <>
        <div className="mini-info-row">
          <Space size={12}>
            <ClockCircleOutlined />
            <span>{estimateEtaMin ? `${estimateEtaMin} daq. atrofida` : 'Yaqin'}</span>
          </Space>
          <Space size={12}>
            <SafetyOutlined />
            <span>Xavfsiz</span>
          </Space>
        </div>

        <div className="tariff-selector">
          {TARIFFS.map(t => (
            <div
              key={t.id}
              className={`tariff-item ${selectedTariff.id === t.id ? 'active' : ''}`}
              onClick={() => setSelectedTariff(t)}
            >
              <div className="tariff-icon">🚖</div>
              <div className="tariff-name">{t.name}</div>
              <div className="tariff-price">{t.basePrice}</div>
            </div>
          ))}
        </div>

        <Button className="order-btn" onClick={handleOrder}>
          Buyurtma berish
        </Button>

        <div className="payment-row">
          <Space><WalletOutlined /> <span>Naqd</span></Space>
          <span>Kommentariya &gt;</span>
        </div>
      </>
    ) : (
      <>
        <div className="fav-list">
          <div className="fav-item" onClick={() => { setDestAddr("Uy"); openDestSearch(); }}>
            <StarFilled style={{ color: '#fadb14' }} /> <span>Uy</span>
          </div>
          <div className="fav-item" onClick={() => { setDestAddr("Ish"); openDestSearch(); }}>
            <StarFilled style={{ color: '#fadb14' }} /> <span>Ish</span>
          </div>
        </div>

        <div className="hint-row">
          <Text type="secondary">Manzilni tanlang — keyin tarif va narx chiqadi</Text>
        </div>
      </>
    )}
  </div>
)}

        {/* --- STEP 2: SEARCHING --- */}
        {mode === 'searching' && (
          <div className="searching-content">
            <Title level={4}>Mashina qidirilmoqda...</Title>
            <div className="loading-pulse"></div>
            <Text type="secondary">Sizga eng yaqin haydovchi qidirilmoqda</Text>
            <Button danger block className="cancel-btn" onClick={cancelOrder}>BEKOR QILISH</Button>
          </div>
        )}

        {/* --- STEP 3: COMING / ARRIVED / RIDE --- */}
        {['coming', 'arrived', 'ride'].includes(mode) && (
          <div className="driver-card">
            <div className="driver-main">
              <Avatar size={64} src={driver?.avatar_url} icon={<UserOutlined />} className="driver-avatar" />
              <div className="driver-info">
                <Title level={4} style={{ margin: 0 }}>
                  {driver?.first_name || "Haydovchi"} <StarFilled style={{ color: '#FFD400', fontSize: 14 }} /> 4.9
                </Title>
                <Text strong className="car-plate">{driver?.plate_number || "95 E 078 SA"}</Text>
                <Text type="secondary" className="car-model">{driver?.car_model || "Oq Chevrolet Spark"}</Text>
              </div>
              <div className="eta-badge">
                {mode === 'coming' ? '3 min' : mode === 'arrived' ? 'Keldi' : 'Safarda'}
              </div>
            </div>

            <div className="action-grid">
              <Button icon={<PhoneOutlined />} onClick={() => window.open(`tel:${driver?.phone}`)}>Qo'ng'iroq</Button>
              <Button icon={<MessageOutlined />} onClick={() => setChatVisible(true)}>Chat</Button>
              <Button icon={<SafetyOutlined />}>Xavfsizlik</Button>
            </div>

            {mode === 'arrived' && (
              <div className="arrived-alert">Haydovchi yetib keldi! Chiqishingizni kutyapti.</div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      <ChatComponent visible={chatVisible} orderId={currentOrder?.id} onClose={() => setChatVisible(false)} />
      <RatingModal visible={ratingVisible} orderId={currentOrder?.id} onFinish={() => { setRatingVisible(false); setMode('main'); }} />

      {/* CSS STYLES (Videodagi effektlar uchun) */}
      <style>{`
        .yandex-container { height: 100vh; background: #000; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; }
        .map-wrapper { height: 70%; transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .map-wrapper.mode-coming, .map-wrapper.mode-searching { height: 55%; }
        
        .top-nav { position: absolute; top: 15px; left: 15px; right: 15px; z-index: 1000; display: flex; justify-content: space-between; }
        .search-bar-mini { background: #fff; padding: 8px 15px; border-radius: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: flex; gap: 8px; align-items: center; font-weight: 600; }

        .bottom-sheet { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; border-radius: 25px 25px 0 0; padding: 15px 20px; z-index: 1100; transition: min-height 0.4s; min-height: 30%; }
        .sheet-handle { width: 40px; height: 5px; background: #e0e0e0; border-radius: 10px; margin: 0 auto 15px; }

        .address-inputs { background: #f5f5f5; border-radius: 15px; padding: 10px; }
        .input-row { display: flex; align-items: center; gap: 12px; padding: 8px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.from { background: #1890ff; }
        .dot.to { background: #ff4d4f; }
        .addr-text { font-size: 15px; font-weight: 500; color: #333; }
        .addr-input { padding: 0; font-size: 16px; font-weight: 600; }

        .tariff-selector { display: flex; gap: 10px; overflow-x: auto; margin: 20px 0; padding-bottom: 5px; }
        .tariff-item { min-width: 90px; text-align: center; padding: 12px; border-radius: 15px; border: 2px solid #f0f0f0; transition: 0.3s; }
        .tariff-item.active { border-color: #FFD400; background: #FFFBE6; }
        .tariff-icon { font-size: 24px; margin-bottom: 5px; }
        .tariff-name { font-weight: 700; font-size: 13px; }
        .tariff-price { font-size: 12px; color: #888; }

        .order-btn { width: 100%; height: 55px; background: #FFD400; border: none; border-radius: 15px; font-size: 17px; font-weight: 800; color: #000; box-shadow: 0 4px 15px rgba(255,212,0,0.3); }
        .payment-row { display: flex; justify-content: space-between; margin-top: 15px; color: #888; font-weight: 600; font-size: 13px; }

        .searching-content { text-align: center; padding: 30px 0; }
        .loading-pulse { width: 60px; height: 60px; background: #FFD400; border-radius: 50%; margin: 20px auto; animation: pulse-ring 1.5s infinite; }
        .cancel-btn { height: 50px; border-radius: 15px; margin-top: 25px; font-weight: 700; }

        .driver-card { padding: 5px 0; }
        .driver-main { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; position: relative; }
        .driver-avatar { border: 3px solid #FFD400; }
        .car-plate { display: block; background: #f0f0f0; padding: 2px 8px; border-radius: 5px; width: fit-content; margin: 4px 0; font-size: 15px; letter-spacing: 1px; }
        .eta-badge { position: absolute; right: 0; top: 0; background: #000; color: #fff; padding: 5px 12px; border-radius: 12px; font-weight: 800; font-size: 12px; }
        .action-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .action-grid button { height: 45px; border-radius: 12px; font-weight: 600; font-size: 12px; }
        .arrived-alert { margin-top: 15px; background: #f6ffed; border: 1px solid #b7eb8f; color: #52c41a; padding: 10px; border-radius: 10px; text-align: center; font-weight: 700; }

        @keyframes pulse-ring { 
          0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(255, 212, 0, 0.7); } 
          70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(255, 212, 0, 0); } 
          100% { transform: scale(0.8); } 
        }
        .user-marker-pulse { width: 16px; height: 16px; background: #1890ff; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 10px rgba(24,144,255,0.5); animation: pulse-blue 2s infinite; }
        @keyframes pulse-blue { 0% { box-shadow: 0 0 0 0 rgba(24,144,255,0.4); } 70% { box-shadow: 0 0 0 15px rgba(24,144,255,0); } 100% { box-shadow: 0 0 0 0 rgba(24,144,255,0); } }
        .smooth-car-marker { transition: all 1.5s linear; }
        .leaflet-routing-container { display: none !important; }
      
.addr-text.placeholder { color: rgba(0,0,0,0.55); }
.mini-info-row { display: flex; justify-content: space-between; padding: 10px 6px 6px; font-size: 13px; }
.fav-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.fav-item { background: rgba(0,0,0,0.04); border-radius: 14px; padding: 12px; display: flex; gap: 10px; align-items: center; cursor: pointer; }
.hint-row { margin-top: 10px; padding: 0 6px; }
`}</style>
    
{/* DESTINATION SEARCH (videodagi "Tochka naznacheniya") */}
<Modal
  open={destSearchVisible}
  title="To'xtash manzili"
  onCancel={() => setDestSearchVisible(false)}
  footer={null}
  destroyOnClose
>
  <Input
    value={destQuery}
    onChange={(e) => searchDestination(e.target.value)}
    placeholder="Manzilni yozing..."
    prefix={<SearchOutlined />}
    autoFocus
  />

  <div style={{ marginTop: 12 }}>
    <List
      bordered
      dataSource={destResults}
      locale={{ emptyText: destQuery?.trim()?.length >= 3 ? "Topilmadi" : "Kamida 3 ta harf yozing" }}
      renderItem={(item) => (
        <List.Item onClick={() => chooseDestination(item)} style={{ cursor: 'pointer' }}>
          <EnvironmentOutlined style={{ marginRight: 8 }} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600 }}>{(item.display_name || '').split(',')[0]}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{item.display_name}</div>
          </div>
        </List.Item>
      )}
    />
  </div>
</Modal>

{/* CANCEL REASON (videodagidek) */}
<Modal
  open={cancelReasonVisible}
  title="Nega bekor qilyapsiz?"
  onCancel={() => { setCancelReasonVisible(false); setCancelReason(''); }}
  onOk={confirmCancelOrder}
  okText="Tayyor"
  cancelText="Yopish"
  destroyOnClose
>
  <List
    dataSource={[
      "Haydovchi uzoq",
      "Narx qimmat",
      "Manzil o'zgardi",
      "Boshqa taxi topdim",
      "Boshqa sabab"
    ]}
    renderItem={(r) => (
      <List.Item
        onClick={() => setCancelReason(r)}
        style={{
          cursor: 'pointer',
          borderRadius: 8,
          marginBottom: 6,
          background: cancelReason === r ? 'rgba(24,144,255,0.08)' : 'transparent'
        }}
      >
        <span style={{ fontWeight: cancelReason === r ? 600 : 400 }}>{r}</span>
      </List.Item>
    )}
  />
  <Input.TextArea
    value={cancelReason && !["Haydovchi uzoq","Narx qimmat","Manzil o'zgardi","Boshqa taxi topdim","Boshqa sabab"].includes(cancelReason) ? cancelReason : ''}
    onChange={(e) => setCancelReason(e.target.value)}
    placeholder="Izoh (ixtiyoriy)"
    rows={3}
    style={{ marginTop: 10 }}
  />
</Modal>
</div>
  );
}