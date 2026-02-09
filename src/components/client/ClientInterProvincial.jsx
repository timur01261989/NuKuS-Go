import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Avatar, message, Tag, Skeleton, Result } from 'antd';
import { 
  ArrowLeftOutlined, CarOutlined, PhoneOutlined, SearchOutlined, 
  EnvironmentFilled, AimOutlined, UserOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CloseOutlined, LoadingOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import { supabase } from "../../pages/supabase"; 

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// --- ICONS ---
const carIcon = L.divIcon({ 
  html: '<div style="font-size: 35px; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3));">🚖</div>', 
  className: 'car-marker', iconSize: [35, 35], iconAnchor: [17, 17]
});
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const { Text, Title } = Typography;

const TARIFFS = [
  { id: 'start', name: 'Start', basePrice: 4000, time: '3 min', icon: <CarOutlined /> },
  { id: 'comfort', name: 'Komfort', basePrice: 6000, time: '5 min', icon: <CarOutlined /> },
  { id: 'delivery', name: 'Yetkazish', basePrice: 10000, time: '10 min', icon: <EnvironmentOutlined /> },
];

// --- ROUTING ---
function RoutingMachine({ from, to, color = '#1890ff' }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !from || !to) return;
    map.eachLayer(l => { if (l.options && l.options.name === 'route-line') map.removeLayer(l) });

    const control = L.Routing.control({
      waypoints: [L.latLng(from), L.latLng(to)],
      lineOptions: { styles: [{ color: color, weight: 6, opacity: 0.8 }] },
      createMarker: () => null, 
      addWaypoints: false, 
      show: false, 
      fitSelectedRoutes: true, 
      router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }) 
    }).addTo(map);

    control.getPlan().options.name = 'route-line';
    return () => { try { map.removeControl(control) } catch(e){} };
  }, [map, from, to, color]);
  return null;
}

function MapFlyTo({ center, trigger }) {
    const map = useMap();
    useEffect(() => { if (center && trigger) map.flyTo(center, 16, { animate: true, duration: 1.5 }); }, [trigger, center, map]);
    return null;
}

// --- OVOZLI YORDAMCHI ---
const playSoundOrSpeak = (text, audioFile) => {
    const path = audioFile ? `/sounds/${audioFile}` : null;

    if (path) {
        const audio = new Audio(path);
        audio.play().catch(e => {
            console.log("Audio file topilmadi, robot gapiradi:", e);
            speak(text); 
        });
    } else {
        speak(text);
    }
};

const speak = (text) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'uz-UZ'; 
        utterance.rate = 1.0; 
        window.speechSynthesis.speak(utterance);
    }
};

export default function ClientOrderCreate({ onBack }) {
  const [mode, setMode] = useState('main'); 
  const [userLoc, setUserLoc] = useState([42.4619, 59.6166]); 
  const [destLoc, setDestLoc] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);
  const [realDriver, setRealDriver] = useState(null);
  const [pinAddress, setPinAddress] = useState("Manzilni tanlang");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [selectedTariff, setSelectedTariff] = useState(TARIFFS[0]);

  // --- 1. GPS ---
  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(p => {
            const pos = [p.coords.latitude, p.coords.longitude];
            setUserLoc(pos);
            checkActiveOrder(pos);
            setFlyTrigger(prev => prev + 1);
        });
    } else checkActiveOrder([42.4619, 59.6166]);
  }, []);

  // --- 2. BAZANI TEKSHIRISH ---
  const checkActiveOrder = async (currentPos) => {
      const savedOrderId = localStorage.getItem('activeOrderId');
      if (!savedOrderId) return;
      const { data } = await supabase.from('orders').select('*').eq('id', savedOrderId).single();
      if (data) {
          setCurrentOrderId(data.id);
          handleStatusChange(data.status, data);
      }
  };

  // --- 3. REALTIME KUZATISH ---
  useEffect(() => {
    if (!currentOrderId) return;
    const channel = supabase.channel(`client-order-${currentOrderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${currentOrderId}` }, 
      (payload) => { handleStatusChange(payload.new.status, payload.new); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentOrderId]);

  // --- 4. STATUS O'ZGARISHI (LOGIKA) ---
  const handleStatusChange = (status, data) => {

      // 1. HAYDOVCHI QABUL QILDI (OVOZ BOR)
      if (status === 'accepted') {
          setMode('coming');
          if (data.driver_id) fetchDriverInfo(data.driver_id);
          speak("Haydovchi qabul qildi."); 
      }

      // 2. TAKSI YETIB KELDI (OVOZ BOR)
      if (status === 'arrived' && mode !== 'arrived') {
          setMode('arrived');
          setDriverLoc(userLoc); 
          // Siz so'ragan aniq matn:
          playSoundOrSpeak("Taksi yetib keldi, kutish rejimi ishga tushdi.", "arrived.mp3");
          message.success("Haydovchi yetib keldi!");
      }

      // 3. YURISH BOSHLANDI (OVOZ YO'Q, faqat vizual)
      if (status === 'in_progress' && mode !== 'in_progress') {
          setMode('in_progress');
          // Ovoz yo'q
      }

      // 4. YETIB KELDIK (OVOZ YO'Q, faqat vizual)
      if (status === 'completed') {
          setMode('completed');
          setFinalPrice(data.price); 
          // Ovoz yo'q
          localStorage.removeItem('activeOrderId');
      }
  };

  // --- KUTISH TAYMERI ---
  useEffect(() => {
      let interval;
      if (mode === 'arrived') {
          interval = setInterval(() => setWaitTime(t => t + 1), 1000);
      }
      return () => clearInterval(interval);
  }, [mode]);

  const fetchDriverInfo = async (driverId) => {
      const { data } = await supabase.from('drivers').select('*').eq('id', driverId).single();
      if (data) setRealDriver(data);
  };

  const fetchAddress = async (lat, lng) => {
      setPinAddress("Aniqlanmoqda...");
      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const d = await res.json();
          setPinAddress(d.address.road || "Noma'lum joy");
      } catch (e) { setPinAddress("Manzil"); }
  };

  const startOrder = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const dropoffText = destLoc ? `Lat: ${destLoc[0]}` : null;

      const { data, error } = await supabase.from('orders').insert([{ 
          pickup_location: pinAddress, 
          dropoff_location: dropoffText, 
          price: selectedTariff.basePrice, 
          status: 'pending', service_type: 'taxi', client_id: user?.id 
      }]).select();

      if (data) {
          setCurrentOrderId(data[0].id);
          localStorage.setItem('activeOrderId', data[0].id);
          setMode('searching');
      }
      setLoading(false);
  };

  const cancelOrder = async () => {
      if (currentOrderId) await supabase.from('orders').update({ status: 'cancelled' }).eq('id', currentOrderId);
      localStorage.removeItem('activeOrderId');
      setMode('main'); setCurrentOrderId(null); setDriverLoc(null);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>

        {/* XARITA QISMI */}
        {mode !== 'completed' && (
            <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer center={userLoc} zoom={16} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <MapFlyTo center={userLoc} trigger={flyTrigger} />

                    {/* Mening joyim */}
                    <Marker position={userLoc} icon={L.divIcon({ className: 'user-pulse-marker', html: `<div style="width: 18px; height: 18px; background: #1890ff; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 4px rgba(24,144,255,0.3);"></div>` })} />

                    {/* Manzil va Chiziq */}
                    {(mode === 'main' || mode === 'in_progress') && destLoc && (
                        <>
                            <Marker position={destLoc} icon={DefaultIcon} />
                            <RoutingMachine from={userLoc} to={destLoc} color="#1890ff" />
                        </>
                    )}

                    {/* Haydovchi */}
                    {(mode === 'coming' || mode === 'arrived' || mode === 'in_progress') && (
                        <Marker position={driverLoc || [userLoc[0]+0.005, userLoc[1]+0.005]} icon={carIcon} />
                    )}
                </MapContainer>

                <Button icon={<ArrowLeftOutlined />} shape="circle" size="large" onClick={onBack} style={{ position: 'absolute', top: 15, left: 15, zIndex: 999 }} />
                <Button icon={<AimOutlined />} shape="circle" size="large" onClick={() => setFlyTrigger(n => n+1)} style={{ position: 'absolute', top: 80, right: 15, zIndex: 999 }} />
            </div>
        )}

        {/* --- PANEL QISMI --- */}

        {/* 1. ASOSIY EKRAN */}
        {mode === 'main' && (
            <Card style={{ borderRadius: '24px 24px 0 0', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}>
                <div onClick={() => { 
                    setDestLoc([userLoc[0] + 0.01, userLoc[1] + 0.01]); 
                    message.info("Manzil tanlandi (Simulyatsiya)");
                }} style={{ background: '#f5f5f5', padding: 15, borderRadius: 16, display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                    <SearchOutlined style={{ fontSize: 20, color: '#faad14', marginRight: 10 }} />
                    <Text strong>{destLoc ? "Manzil tanlandi" : "Qayerga boramiz?"}</Text>
                    {destLoc && <Button type="text" icon={<CloseOutlined />} onClick={(e) => { e.stopPropagation(); setDestLoc(null); }} />}
                </div>

                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
                    {TARIFFS.map(t => (
                        <div key={t.id} onClick={() => setSelectedTariff(t)} style={{ minWidth: 100, padding: 10, borderRadius: 16, background: selectedTariff.id === t.id ? '#fffbe6' : '#f9f9f9', border: selectedTariff.id === t.id ? '2px solid #FFD700' : '2px solid transparent', textAlign: 'center' }}>
                            <div style={{ fontSize: 24 }}>{t.icon}</div>
                            <div>{t.name}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{t.basePrice} so'm</div>
                        </div>
                    ))}
                </div>

                <Button type="primary" block size="large" loading={loading} onClick={startOrder} style={{ marginTop: 20, height: 55, borderRadius: 16, background: '#FFD700', color: '#000', fontWeight: 'bold' }}>
                    Buyurtma berish
                </Button>
            </Card>
        )}

        {/* 3. JARAYON EKRANI */}
        {(['searching', 'coming', 'arrived', 'in_progress'].includes(mode)) && (
            <Card style={{ borderRadius: '24px 24px 0 0', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}>
                {mode === 'searching' && (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                        <LoadingOutlined style={{ fontSize: 40, color: '#faad14', marginBottom: 15 }} />
                        <Title level={4}>Haydovchi qidirilmoqda...</Title>
                        <Button danger type="text" onClick={cancelOrder}>Bekor qilish</Button>
                    </div>
                )}

                {mode !== 'searching' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                             <div>
                                 {mode === 'coming' && <Text style={{ color: '#faad14', fontWeight: 'bold' }}>Mashina kelmoqda</Text>}

                                 {mode === 'arrived' && (
                                     <div>
                                         <Title level={4} style={{ margin: 0, color: '#52c41a' }}>Yetib keldi!</Title>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'red' }}>
                                             <ClockCircleOutlined /> 
                                             <span>Kutish: {Math.floor(waitTime/60)}:{String(waitTime%60).padStart(2,'0')}</span>
                                         </div>
                                     </div>
                                 )}

                                 {mode === 'in_progress' && (
                                     <div>
                                         <Title level={4} style={{ margin: 0, color: '#1890ff' }}>Yo'ldamiz</Title>
                                         <Text type="secondary">Oq yo'l!</Text>
                                     </div>
                                 )}
                             </div>
                             <Tag color="gold">5.0 ★</Tag>
                        </div>

                        <div style={{ display: 'flex', gap: 15, alignItems: 'center', background: '#f9f9f9', padding: 15, borderRadius: 20 }}>
                           <Avatar size={50} src={realDriver?.avatar_url} icon={<UserOutlined />} />
                           <div>
                              <div style={{ fontWeight: 'bold' }}>{realDriver ? `${realDriver.first_name}` : 'Haydovchi'}</div>
                              <div style={{ color: '#666', fontSize: 13 }}>{realDriver ? `${realDriver.car_model} • ${realDriver.car_color}` : '...'}</div>
                           </div>
                           <div style={{ marginLeft: 'auto', background: '#fff', padding: '5px 10px', borderRadius: 8, border: '1px solid #eee', fontWeight: 'bold' }}>
                               {realDriver?.plate_number || '---'}
                           </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <Button icon={<PhoneOutlined />} style={{ flex: 1, height: 50, borderRadius: 12, background: '#e6f7ff', color: '#1890ff', border: 'none' }}>Tel</Button>
                        </div>
                    </div>
                )}
            </Card>
        )}

        {/* 4. YAKUNIY CHEK */}
        {mode === 'completed' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6ffed' }}>
                <div style={{ textAlign: 'center', padding: 30, background: '#fff', borderRadius: 30, width: '80%', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                    <CheckCircleOutlined style={{ fontSize: 60, color: '#52c41a', marginBottom: 20 }} />
                    <Title level={3} style={{ margin: 0 }}>Yetib keldik!</Title>
                    <div style={{ margin: '30px 0' }}>
                        <Text style={{ fontSize: 16, color: '#888' }}>Jami to'lov:</Text>
                        <Title level={1} style={{ margin: 0, color: '#1890ff' }}>{parseInt(finalPrice).toLocaleString()} so'm</Title>
                    </div>
                    <Button type="primary" block size="large" onClick={() => { setMode('main'); setCurrentOrderId(null); }} style={{ height: 55, borderRadius: 16, background: '#000' }}>Yopish</Button>
                </div>
            </div>
        )}
        <style>{`.user-pulse-marker { animation: pulse 2s infinite; } @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(24,144,255,0.4); } 70% { box-shadow: 0 0 0 20px rgba(24,144,255,0); } 100% { box-shadow: 0 0 0 0 rgba(24,144,255,0); } }`}</style>
    </div>
  );
}