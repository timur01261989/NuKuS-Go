import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Typography, Space, Drawer, Skeleton, List, Avatar, message } from 'antd';
import { 
  SearchOutlined, ArrowLeftOutlined, EnvironmentOutlined, 
  HomeOutlined, CarOutlined, AimOutlined, ClockCircleOutlined,
  CloseOutlined, LoadingOutlined
} from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { playAliceVoice, calculateDistance } from '../utils/audioPlayer';
import SearchRadar from '../components/map/SearchRadar';
import { useEffect } from 'react';
import { startTracking } from '../hooks/useLocation';
import { setupNotifications } from '../services/fcmService';
import { playAliceVoice } from '../utils/audioPlayer';

const MainMap = () => {
  useEffect(() => {
    // 1. Bildirishnomalarni yoqish
    setupNotifications();

    // 2. Joylashuvni kuzatishni boshlash
    const watchId = startTracking((coords) => {
      // Bazaga haydovchining yangi koordinatasini yuboramiz
      updateDriverLocationInSupabase(coords);
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div>
      {/* Xarita va Radar komponentlari */}
    </div>
  );
};
const MapPage = ({ orderStatus, userLocation, cameras }) => {
  const [mapTheme, setMapTheme] = useState('light');

  // 1. Statusga qarab Alisa gapiradi
  useEffect(() => {
    if (orderStatus === 'accepted') playAliceVoice('RouteStarted');
    if (orderStatus === 'arrived') playAliceVoice('Arrived');
  }, [orderStatus]);

  // 2. Vaqtga qarab xarita mavzusini o'zgartirish
  useEffect(() => {
    const hour = new Date().getHours();
    setMapTheme((hour >= 20 || hour <= 6) ? 'dark' : 'light');
  }, []);

  // 3. Radar (Kamera) yaqinlashganda ogohlantirish
  useEffect(() => {
    if (userLocation && cameras) {
      cameras.forEach(cam => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, cam.lat, cam.lng);
        if (dist < 300) playAliceVoice('SpeedCamera');
      });
    }
  }, [userLocation]);

  return (
    <div className={`map-container ${mapTheme}`}>
      <SearchRadar isVisible={orderStatus === 'searching'} />
      {/* Xarita komponentingiz shu yerda */}
    </div>
  );
};

const { Text, Title } = Typography;

// --- 1. DYNAMIC RENDERING (Environmental HDR & Cubemap Filter simulyatsiyasi) ---
function MapDecorator() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    // Yandex Go HDR yoritish effekti (contrast va saturate orqali)
    container.style.filter = 'contrast(1.08) saturate(1.15) brightness(1.02)'; 
    container.style.transition = 'filter 0.5s ease-in-out';
  }, [map]);
  return null;
}

// --- 2. ROUTING ENGINE ---
function RoutingMachine({ from, to, onRouteDetails }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !from || !to) return;
    const control = L.Routing.control({
      waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
      lineOptions: { 
        styles: [{ color: '#000', weight: 5, opacity: 0.7, dashArray: '10, 10' }] 
      },
      addWaypoints: false,
      draggableWaypoints: false,
      show: false
    }).on('routesfound', (e) => onRouteDetails(e.routes[0].summary.totalDistance)).addTo(map);

    return () => { try { map.removeControl(control) } catch(e){} };
  }, [map, from, to]);
  return null;
}

export default function MainPage() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [selectingFromMap, setSelectingFromMap] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const [userLoc, setUserLoc] = useState([42.4619, 59.6166]);
  const [targetLoc, setTargetLoc] = useState([42.4619, 59.6166]); 
  const [userAddress, setUserAddress] = useState("Aniqlanmoqda...");
  const [targetAddress, setTargetAddress] = useState("Manzil tanlanmagan");
  const [routeInfo, setRouteInfo] = useState({ distance: 0, price: 9000 });

  const homeAddress = "Allayar ko'chasi 3/1"; 

  // --- 3. ASSET MANIFEST & HDR LOGIC ---
  useEffect(() => {
    // Resurslar xaritasi yuklanganini simulyatsiya qilish
    console.log("AssetManifest.json: Nukus Go resurslari v1.0.0 muvaffaqiyatli yuklandi");
  }, []);

  const getAddress = async (lat, lng, isUser = false) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.display_name.split(',').slice(0, 2).join(', ');
        isUser ? setUserAddress(addr) : setTargetAddress(addr);
      }
    } catch (e) { console.error("Geocoding xatosi"); }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLoc([latitude, longitude]);
        getAddress(latitude, longitude, true);
      }, () => getAddress(42.4619, 59.6166, true));
    }
  }, []);

  const handleRouteDetails = (distance) => {
    setLoadingPrice(true);
    setTimeout(() => {
       setRouteInfo({
         distance: (distance/1000).toFixed(1), 
         price: Math.max(9000, Math.round((distance/1000)*2500))
       });
       setLoadingPrice(false);
    }, 1200);
  };

  function MapEvents() {
    useMapEvents({
      movestart: () => { if (selectingFromMap) setIsMoving(true); },
      moveend: (e) => {
        if (selectingFromMap) {
          const center = e.target.getCenter();
          setTargetLoc([center.lat, center.lng]);
          setIsMoving(false);
          getAddress(center.lat, center.lng);
        }
      },
    });
    return null;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>

      {/* Orqaga tugmasi (YandexGo Style Taktil) */}
      <Button 
        shape="circle" size="large" icon={<ArrowLeftOutlined />} 
        onClick={() => {
          if (showPricing) setShowPricing(false);
          else if (selectingFromMap) setSelectingFromMap(false);
          else if (isSearching) setIsSearching(false);
          else navigate('/dashboard');
        }} 
        style={{ 
          position: 'absolute', top: 20, left: 20, zIndex: 1001, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)', border: 'none',
          transition: 'transform 0.1s' 
        }} 
        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"}
        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
      />

      <MapContainer center={userLoc} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <MapDecorator />

        {/* User Pulse Marker */}
        {!selectingFromMap && (
           <Marker position={userLoc} icon={L.divIcon({ className: 'user-marker', html: '<div class="pulse-ring"></div><div class="dot"></div>' })} />
        )}

        {showPricing && <RoutingMachine from={userLoc} to={targetLoc} onRouteDetails={handleRouteDetails} />}
        <MapEvents />
      </MapContainer>

      {/* Xaritadan tanlash markeri (Cubemap & Occlusion simulyatsiyasi) */}
      {selectingFromMap && (
        <div className={`center-pin ${isMoving ? 'moving' : ''}`}>
          <div className="pin-shadow"></div>
          <EnvironmentOutlined style={{ fontSize: '48px', color: '#FFD700', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.3))' }} />
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>

        {/* 1. ASOSIY PANEL */}
        {!isSearching && !showPricing && !selectingFromMap && (
          <Card 
            className="bottom-card"
            style={{ borderRadius: '32px 32px 0 0', border: 'none', boxShadow: '0 -8px 30px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
          >
            <Button 
              type="primary" block size="large" icon={<SearchOutlined />} 
              onClick={() => setIsSearching(true)} 
              style={{ 
                background: '#1890ff', height: 60, borderRadius: '18px', border: 'none', 
                marginBottom: 20, fontSize: 18, fontWeight: 800, boxShadow: '0 10px 20px rgba(24,144,255,0.3)'
              }}
            > 
              Qayerga borasiz? 
            </Button>
            <Space align="center" style={{ width: '100%', justifyContent: 'center', opacity: 0.7 }}>
               <HomeOutlined />
               <Text strong>{homeAddress}</Text>
            </Space>
          </Card>
        )}

        {/* 2. XARITADAN TANLASH TASDIQLASH */}
        {selectingFromMap && !isMoving && (
          <div style={{ padding: '20px', background: 'transparent' }}>
             <Card style={{ borderRadius: 20, marginBottom: 15, textAlign: 'center', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
                <Text strong style={{ fontSize: 16 }}>{targetAddress}</Text>
             </Card>
             <Button 
               type="primary" block size="large"
               onClick={() => { setSelectingFromMap(false); setShowPricing(true); }}
               style={{ background: '#FFD700', color: '#000', height: 65, borderRadius: 20, fontWeight: 900, border: 'none', fontSize: 18 }}
             > TAYYOR </Button>
          </div>
        )}

        {/* 3. NARX VA BUYURTMA (SKELETON BILAN) */}
        {showPricing && (
          <Card 
            style={{ borderRadius: '32px 32px 0 0', border: 'none', boxShadow: '0 -10px 40px rgba(0,0,0,0.12)' }}
            bodyStyle={{ padding: '28px' }}
          >
            {loadingPrice ? (
               <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <Skeleton.Input active size="large" style={{ width: 180, borderRadius: 10 }} />
                  <br/><br/>
                  <Skeleton.Input active size="small" style={{ width: 100, borderRadius: 8 }} />
               </div>
            ) : (
               <div style={{ textAlign: 'center', marginBottom: 25 }}>
                 <Title level={1} style={{ margin: 0, fontWeight: 950, letterSpacing: '-1px' }}>{routeInfo.price.toLocaleString()} so'm</Title>
                 <Text type="secondary" style={{ fontSize: 15, fontWeight: 600 }}>
                   {routeInfo.distance} km • {Math.round(routeInfo.distance * 2)} min
                 </Text>
               </div>
            )}

            <Button 
              type="primary" block size="large" 
              disabled={loadingPrice}
              onClick={() => setIsOrdering(true)}
              style={{ 
                background: 'black', color: 'white', height: 65, borderRadius: '20px', 
                fontWeight: 900, fontSize: 20, border: 'none'
              }} 
            > 
              {loadingPrice ? 'HISOBLANMOQDA...' : 'BUYURTMA BERISH'}
            </Button>
          </Card>
        )}
      </div>

      {/* 4. RADAR SEARCH (AssetManifest uslubida animatsiya) */}
      <Drawer 
        placement="bottom" height="100vh" closable={false} open={isOrdering}
        bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="radar-circle">
           <div className="ripple"></div>
           <div className="ripple"></div>
           <CarOutlined style={{ fontSize: 80, color: '#FFD700', zIndex: 10 }} />
        </div>
        <Title level={2} style={{ marginTop: 50, fontWeight: 900 }}>Qidirilmoqda...</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>Nukus Go haydovchilari xabardor qilindi</Text>
        <Button danger size="large" shape="round" onClick={() => setIsOrdering(false)} style={{ marginTop: 60, height: 55, padding: '0 40px', fontWeight: 700 }}>BEKOR QILISH</Button>
      </Drawer>

      <style>{`
        .user-marker { position: relative; }
        .dot { width: 14px; height: 14px; background: #1890ff; border-radius: 50%; border: 3px solid white; position: relative; z-index: 2; }
        .pulse-ring { position: absolute; top: -8px; left: -8px; width: 30px; height: 30px; border-radius: 50%; background: rgba(24,144,255,0.3); animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }

        .center-pin { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%); z-index: 1000; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .center-pin.moving { transform: translate(-50%, -120%) scale(1.1); }
        .pin-shadow { width: 10px; height: 4px; background: rgba(0,0,0,0.2); border-radius: 50%; margin: 0 auto; margin-bottom: -5px; }

        .radar-circle { position: relative; width: 180px; height: 180px; display: flex; align-items: center; justify-content: center; }
        .ripple { position: absolute; width: 100%; height: 100%; border: 2px solid #FFD700; border-radius: 50%; animation: ripple 2s infinite linear; }
        .ripple:nth-child(2) { animation-delay: 1s; }
        @keyframes ripple { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }

        .leaflet-marker-icon { transition: transform 1.2s linear !important; }
      `}</style>
    </div>
  );
}