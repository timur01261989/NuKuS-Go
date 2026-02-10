import React, { useState, useEffect } from 'react';
import { Button, Typography } from 'antd';
import {
  ArrowLeftOutlined
} from '@ant-design/icons';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';

import { playAliceVoice, calculateDistance } from '../utils/AudioPlayer';
import SearchRadar from '../components/map/SearchRadar';
import { startTracking } from '../hooks/useLocation';
import { setupNotifications } from '../services/fcmService';

const { Title, Text } = Typography;

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
      addWaypoints: false,
      draggableWaypoints: false,
      show: false
    })
      .on('routesfound', (e) => {
        onRouteDetails(e.routes[0].summary.totalDistance);
      })
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

  const [userLoc, setUserLoc] = useState([42.4619, 59.6166]);
  const [targetLoc, setTargetLoc] = useState([42.4619, 59.6166]);

  const [userAddress, setUserAddress] = useState("Aniqlanmoqda...");
  const [targetAddress, setTargetAddress] = useState("Manzil tanlanmagan");

  const [routeInfo, setRouteInfo] = useState({
    distance: 0,
    price: 9000
  });

  /* ================= INIT ================= */

  useEffect(() => {
    setupNotifications();

    const watchId = startTracking(() => {});

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ================= GEO ================= */

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
      console.log("Geocode error");
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        setUserLoc([latitude, longitude]);
        getAddress(latitude, longitude, true);
      },
      () => getAddress(42.4619, 59.6166, true)
    );

  }, []);

  /* ================= ROUTE ================= */

  const handleRouteDetails = (distance) => {
    setRouteInfo({
      distance: (distance / 1000).toFixed(1),
      price: Math.max(9000, Math.round((distance / 1000) * 2500))
    });
  };

  /* ================= MAP EVENTS ================= */

  function MapEvents() {
    useMapEvents({
      movestart: () => selectingFromMap && setIsMoving(true),
      moveend: (e) => {
        if (!selectingFromMap) return;

        const center = e.target.getCenter();

        setTargetLoc([center.lat, center.lng]);
        setIsMoving(false);
        getAddress(center.lat, center.lng);
      }
    });

    return null;
  }

  /* ================= UI ================= */

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#f0f0f0'
      }}
    >

      {/* BACK BUTTON */}
      <Button
        shape="circle"
        size="large"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/dashboard')}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1001
        }}
      />

      {/* MAP */}
      <MapContainer
        center={userLoc}
        zoom={16}
        zoomControl={false}
        style={{
          width: '100%',
          height: '100%'
        }}
      >

        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        <MapDecorator />

        {!selectingFromMap && (
          <Marker
            position={userLoc}
            icon={L.divIcon({
              className: 'user-marker',
              html: '<div class="pulse-ring"></div><div class="dot"></div>'
            })}
          />
        )}

        {showPricing && (
          <RoutingMachine
            from={userLoc}
            to={targetLoc}
            onRouteDetails={handleRouteDetails}
          />
        )}

        <MapEvents />

      </MapContainer>

      {/* SEARCH RADAR */}
      <SearchRadar isVisible={isSearching} />

    </div>
  );
}
