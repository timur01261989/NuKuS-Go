import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Avatar, message, Tag, Skeleton, Result, Rate, Input, Badge } from 'antd';
import { 
  ArrowLeftOutlined, CarOutlined, PhoneOutlined, SearchOutlined, 
  EnvironmentFilled, AimOutlined, UserOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CloseOutlined, LoadingOutlined,
  EnvironmentOutlined, SoundOutlined, MessageOutlined, StarFilled
} from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import { supabase } from "../../../lib/supabase"; 

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Chat va Rating komponentlari
import ChatComponent from '../../chat/components/ChatComponent'; 
import RatingModal from '../../shared/components/RatingModal'; 

const getMapStyle = () => {
  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 6;

  if (isNight) {
    // HDR Night Style (Stadia Maps / Alidade Smooth Dark)
    // Bu uslub yo'llarni neon rangda, bino va xaritalarni chuqur HDR qora rangda ko'rsatadi
    return "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png";
  }

  // Kunduzgi professional uslub
  return "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
};
// --- ICONS ---
const carIcon = L.divIcon({ 
  html: '<div class="smooth-car-wrapper" style="font-size: 35px; transition: all 1.5s linear; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">🚖</div>', 
  className: 'car-marker-container', iconSize: [35, 35], iconAnchor: [17, 17]
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
      lineOptions: { styles: [{ color: color, weight: 6, opacity: 0.8, dashArray: '5, 10' }] },
      createMarker: () => null, addWaypoints: false, show: false, fitSelectedRoutes: true,
      router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }) 
    }).addTo(map);
    return () => { try { map.removeControl(control) } catch(e){} };
  }, [map, from, to, color]);
  return null;
}

function MapFlyTo({ center, trigger }) {
    const map = useMap();
    useEffect(() => { if (center && trigger) map.flyTo(center, 16, { animate: true, duration: 1.5 }); }, [trigger, center, map]);
    return null;
}

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

  // Chat va Rating uchun statelar
  const [chatVisible, setChatVisible] = useState(false);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [userId, setUserId] = useState(null);

  const btnTouchProps = {
    onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.96)",
    onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
    style: { transition: "transform 0.1s" }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(p => {
            const pos = [p.coords.latitude, p.coords.longitude];
            setUserLoc(pos);
            checkActiveOrder();
            setFlyTrigger(prev => prev + 1);
        });
    }
  }, []);

  const checkActiveOrder = async () => {
      const savedOrderId = localStorage.getItem('activeOrderId');
      if (!savedOrderId) return;
      const { data } = await supabase.from('orders').select('id, status, price, driver_id, client_id').eq('id', savedOrderId).single();
      if (data) {
          setCurrentOrderId(data.id);
          handleStatusChange(data.status, data);
      }
  };

  useEffect(() => {
    if (!currentOrderId) return;
    const channel = supabase.channel(`client-order-${currentOrderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${currentOrderId}` }, 
      (payload) => { handleStatusChange(payload.new.status, payload.new); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentOrderId]);

  useEffect(() => {
    if (!realDriver?.id) return;
    const driverChannel = supabase.channel(`driver-gps-${realDriver.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drivers', filter: `id=eq.${realDriver.id}` }, 
      (payload) => {
        const { current_lat, current_lng } = payload.new;
        if (current_lat && current_lng) setDriverLoc([current_lat, current_lng]);
      })
      .subscribe();
    return () => { supabase.removeChannel(driverChannel); };
  }, [realDriver]);

  const handleStatusChange = (status, data) => {
      if (status === 'accepted') {
          setMode('coming');
          if (data.driver_id) fetchDriverInfo(data.driver_id);
          speak("Buyurtma qabul qilindi.");
      }
      if (status === 'arrived' && mode !== 'arrived') {
          setMode('arrived');
          speak("Haydovchi yetib keldi.");
      }
      if (status === 'in_progress' && mode !== 'in_progress') {
          setMode('in_progress');
          speak("Safar boshlandi.");
      }
      if (status === 'completed') {
          setMode('completed');
          setFinalPrice(data.price || 0);
          setRatingVisible(true); 
          localStorage.removeItem('activeOrderId');
      }
  };

  useEffect(() => {
      let interval;
      if (mode === 'arrived') interval = setInterval(() => setWaitTime(t => t + 1), 1000);
      return () => clearInterval(interval);
  }, [mode]);

  const fetchDriverInfo = async (driverId) => {
      const { data } = await supabase.from('drivers').select('*').eq('id', driverId).single();
      if (data) setRealDriver(data);
  };

  const startOrder = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const dropoffText = destLoc ? `Lat: ${destLoc[0]}, Lng: ${destLoc[1]}` : null;
      const { data } = await supabase.from('orders').insert([{ 
          pickup_location: pinAddress, dropoff_location: dropoffText, 
          price: selectedTariff.basePrice, status: 'pending', service_type: 'taxi', client_id: user?.id,
          created_at: new Date().toISOString()
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
      setMode('main'); setCurrentOrderId(null);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <div style={{ flex: 1, position: 'relative' }}>
            <MapContainer center={userLoc} zoom={16} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                {/* TUNGI REJIM INTEGRATSIYASI */}
                <TileLayer url={getMapStyle()} />
                <MapFlyTo center={userLoc} trigger={flyTrigger} />
                <Marker position={userLoc} icon={L.divIcon({ className: 'user-pulse-marker', html: `<div style="width: 18px; height: 18px; background: #1890ff; border-radius: 50%; border: 3px solid white;"></div>` })} />
                {(mode === 'coming' || mode === 'arrived' || mode === 'in_progress') && (
                    <Marker position={driverLoc || [userLoc[0]+0.003, userLoc[1]+0.003]} icon={carIcon} />
                )}
            </MapContainer>

            {['coming', 'arrived', 'in_progress'].includes(mode) && (
              <Badge dot={false} style={{ position: 'absolute', bottom: 320, right: 20, zIndex: 1000 }}>
                <Button 
                  shape="circle" size="large" icon={<MessageOutlined />} 
                  onClick={() => setChatVisible(true)}
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: 'none' }}
                />
              </Badge>
            )}

            <Button icon={<ArrowLeftOutlined />} shape="circle" size="large" onClick={onBack} style={{ position: 'absolute', top: 15, left: 15, zIndex: 999 }} />
        </div>

        {mode === 'main' && (
            <Card style={{ borderRadius: '24px 24px 0 0', border: 'none' }}>
                <div onClick={() => { setDestLoc([userLoc[0] + 0.008, userLoc[1] + 0.008]); setPinAddress("Nukus, Berdaq"); }} style={{ background: '#f5f5f5', padding: 15, borderRadius: 16, marginBottom: 20 }}>
                    <SearchOutlined style={{ marginRight: 10 }} />
                    <Text strong>{destLoc ? pinAddress : "Qayerga boramiz?"}</Text>
                </div>
                <Button type="primary" block size="large" onClick={startOrder} {...btnTouchProps} style={{ height: 60, borderRadius: 20, background: '#FFD700', color: '#000', fontWeight: '900' }}> BUYURTMA BERISH </Button>
            </Card>
        )}

        {['coming', 'arrived', 'in_progress'].includes(mode) && (
            <Card style={{ borderRadius: '24px 24px 0 0', border: 'none', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}>
               <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                  <Avatar size={60} src={realDriver?.avatar_url} icon={<UserOutlined />} style={{ border: '3px solid #FFD700' }} />
                  <div>
                     <div style={{ fontWeight: '900' }}>{realDriver?.first_name || 'Haydovchi'}</div>
                     <Text type="secondary">{realDriver?.car_model} • {realDriver?.plate_number}</Text>
                  </div>
                  <Button icon={<PhoneOutlined />} shape="circle" style={{ marginLeft: 'auto' }} />
               </div>
            </Card>
        )}

        {mode === 'completed' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Result status="success" title="Safar yakunlandi!" subTitle={`To'lov: ${finalPrice.toLocaleString()} so'm`} 
              extra={[<Button type="primary" key="close" onClick={() => setMode('main')}>Yopish</Button>]} />
          </div>
        )}

        <ChatComponent 
          orderId={currentOrderId} 
          userId={userId} 
          visible={chatVisible} 
          onClose={() => setChatVisible(false)} 
        />

        <RatingModal 
          visible={ratingVisible} 
          order={{ id: currentOrderId, client_id: userId, driver_id: realDriver?.id }}
          onFinish={() => {
            setRatingVisible(false);
            setMode('main');
          }}
        />

        <style>{`
          .leaflet-marker-icon { transition: transform 1.5s linear !important; }
          .user-pulse-marker { animation: pulse 2s infinite; }
          @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(24,144,255,0.4); } 70% { box-shadow: 0 0 0 20px rgba(24,144,255,0); } 100% { box-shadow: 0 0 0 0 rgba(24,144,255,0); } }
        `}</style>
    </div>
  );
}
