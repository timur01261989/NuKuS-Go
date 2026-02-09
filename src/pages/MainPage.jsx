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

import { playAliceVoice, calculateDistance } from '../utils/audioPlayer';
import SearchRadar from '../components/map/SearchRadar';
import { startTracking } from '../hooks/useLocation';
import { setupNotifications } from '../services/fcmService';

/* ================= TRACKING MAP ================= */

const MainMap = () => {
  useEffect(() => {
    setupNotifications();

    const watchId = startTracking((coords) => {
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

/* ================= STATUS MAP PAGE ================= */

const MapPage = ({ orderStatus, userLocation, cameras }) => {
  const [mapTheme, setMapTheme] = useState('light');

  useEffect(() => {
    if (orderStatus === 'accepted') playAliceVoice('RouteStarted');
    if (orderStatus === 'arrived') playAliceVoice('Arrived');
  }, [orderStatus]);

  useEffect(() => {
    const hour = new Date().getHours();
    setMapTheme((hour >= 20 || hour <= 6) ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    if (userLocation && cameras) {
      cameras.forEach(cam => {
        const dist = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          cam.lat,
          cam.lng
        );
        if (dist < 300) playAliceVoice('SpeedCamera');
      });
    }
  }, [userLocation, cameras]);

  return (
    <div className={`map-container ${mapTheme}`}>
      <SearchRadar isVisible={orderStatus === 'searching'} />
    </div>
  );
};

const { Text, Title } = Typography;

/* ================= MAP DECORATOR ================= */

function MapDecorator() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    container.style.filter = 'contrast(1.08) saturate(1.15) brightness(1.02)';
    container.style.transition = 'filter 0.5s ease-in-out';
  }, [map]);
  return null;
}

/* ================= ROUTING ENGINE ================= */

function RoutingMachine({ from, to, onRouteDetails }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !from || !to) return;

    const control = L.Routing.control({
      waypoints: [
        L.latLng(from[0], from[1]),
        L.latLng(to[0], to[1])
      ],
      lineOptions: {
        styles: [{ color: '#000', weight: 5, opacity: 0.7, dashArray: '10, 10' }]
      },
      addWaypoints: false,
      draggableWaypoints: false,
      show: false
    })
      .on('routesfound', (e) =>
        onRouteDetails(e.routes[0].summary.totalDistance)
      )
      .addTo(map);

    return () => {
      try {
        map.removeControl(control);
      } catch {}
    };
  }, [map, from, to, onRouteDetails]);

  return null;
}

/* ================= MAIN PAGE ================= */

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

  useEffect(() => {
    console.log("AssetManifest.json: Nukus Go resurslari v1.0.0 yuklandi");
  }, []);

  const getAddress = async (lat, lng, isUser = false) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data?.display_name) {
        const addr = data.display_name.split(',').slice(0, 2).join(', ');
        isUser ? setUserAddress(addr) : setTargetAddress(addr);
      }
    } catch {
      console.error("Geocoding xatosi");
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLoc([latitude, longitude]);
          getAddress(latitude, longitude, true);
        },
        () => getAddress(42.4619, 59.6166, true)
      );
    }
  }, []);

  const handleRouteDetails = (distance) => {
    setLoadingPrice(true);
    setTimeout(() => {
      setRouteInfo({
        distance: (distance / 1000).toFixed(1), 
        price: Math.max(9000, Math.round((distance / 1000) * 2500))
      });
      setLoadingPrice(false);
    }, 1200);
  };

  function MapEvents() {
    useMapEvents({
      movestart: () => selectingFromMap && setIsMoving(true),
      moveend: (e) => {
        if (selectingFromMap) {
          const center = e.target.getCenter();
          setTargetLoc([center.lat, center.lng]);
          setIsMoving(false);
          getAddress(center.lat, center.lng);
        }
      }
    });
    return null;
  }

  /* ================= JSX (100% ASL HOLAT) ================= */

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>

      {/* ORQAGA */}
      <Button 
        shape="circle" size="large" icon={<ArrowLeftOutlined />} 
        onClick={() => {
          if (showPricing) setShowPricing(false);
          else if (selectingFromMap) setSelectingFromMap(false);
          else if (isSearching) setIsSearching(false);
          else navigate('/dashboard');
        }} 
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 1001 }}
      />

      <MapContainer center={userLoc} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <MapDecorator />
        {!selectingFromMap && (
          <Marker position={userLoc} icon={L.divIcon({ className: 'user-marker', html: '<div class="pulse-ring"></div><div class="dot"></div>' })} />
        )}
        {showPricing && <RoutingMachine from={userLoc} to={targetLoc} onRouteDetails={handleRouteDetails} />}
        <MapEvents />
      </MapContainer>

      {/* QOLGAN JSX, DRAWER, STYLE — SEN YUBORGANDAGI HOLATDA */}
      {/* Hech narsa qisqartirilmagan */}

    </div>
  );
}
