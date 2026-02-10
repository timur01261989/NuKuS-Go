import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Typography } from "antd";
import { useNavigate } from "react-router-dom";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { setupNotifications } from "../services/notifications";

// ✅ Sizdagi real map components (screenshotdagi papka)
import MapCenterPicker from "../features/map/components/MapCenterPicker";
import RoutingMachine from "../features/map/components/RoutingMachine";
import UserMarker from "../features/map/components/UserMarker";
import SearchRadar from "../features/map/components/SearchRadar";

import CenterPin from "../features/map/components/CenterPin";
import TargetMarker from "../features/map/components/TargetMarker";

import useRealtimeDrivers from "../features/driver/hooks/useRealtimeDrivers";
import DriverMarker from "../features/driver/components/DriverMarker";

const { Title, Text } = Typography;

const DEFAULT_LOC = [42.4619, 59.6166]; // fallback

export default function MainPage() {
  const navigate = useNavigate();

  // ===================== UI STATE =====================
  const [selectingFromMap, setSelectingFromMap] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // map ko‘chayotganda status (pin anim uchun)
  const [isMoving, setIsMoving] = useState(false);

  // route/pricing ko‘rsatish
  const [showPricing, setShowPricing] = useState(true);

  // ===================== LOCATION STATE =====================
  const [userLoc, setUserLoc] = useState(DEFAULT_LOC);
  const [targetLoc, setTargetLoc] = useState(DEFAULT_LOC);

  // ===================== ADDRESS STATE =====================
  const [userAddress, setUserAddress] = useState("Aniqlanmoqda...");
  const [targetAddress, setTargetAddress] = useState("Manzil tanlanmagan");

  // ===================== ROUTE STATE =====================
  const [distanceMeters, setDistanceMeters] = useState(0);

  const distanceKm = useMemo(() => (distanceMeters / 1000).toFixed(1), [distanceMeters]);

  const priceUzs = useMemo(() => {
    const km = distanceMeters / 1000;
    return Math.max(9000, Math.round(km * 2500));
  }, [distanceMeters]);

  // ===================== HAPTIC (MOBILE) =====================
  const haptic = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(20);
  }, []);

  // ===================== REALTIME DRIVERS (SUPABASE) =====================
  const { drivers } = useRealtimeDrivers({
    enabled: true,
    center: userLoc,
    radiusMeters: 2000,
  });

  // ===================== NOTIFICATIONS =====================
  useEffect(() => {
    setupNotifications();
  }, []);

  // ===================== REVERSE GEOCODE =====================
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();

      if (data?.display_name) {
        return data.display_name.split(",").slice(0, 2).join(", ");
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const setUserAddrByCoords = useCallback(
    async (lat, lng) => {
      const addr = await reverseGeocode(lat, lng);
      if (addr) setUserAddress(addr);
    },
    [reverseGeocode]
  );

  const setTargetAddrByCoords = useCallback(
    async (lat, lng) => {
      const addr = await reverseGeocode(lat, lng);
      if (addr) setTargetAddress(addr);
    },
    [reverseGeocode]
  );

  // ===================== GEOLOCATION INIT =====================
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserAddrByCoords(DEFAULT_LOC[0], DEFAULT_LOC[1]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setUserLoc([lat, lng]);
        setTargetLoc([lat, lng]);

        setUserAddrByCoords(lat, lng);
      },
      () => {
        // fallback
        setUserLoc(DEFAULT_LOC);
        setTargetLoc(DEFAULT_LOC);
        setUserAddrByCoords(DEFAULT_LOC[0], DEFAULT_LOC[1]);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [setUserAddrByCoords]);

  // ===================== TARGET CHANGED => ADDRESS =====================
  useEffect(() => {
    if (!targetLoc?.length) return;
    setTargetAddrByCoords(targetLoc[0], targetLoc[1]);
  }, [targetLoc?.[0], targetLoc?.[1], setTargetAddrByCoords]);

  // ===================== ROUTING CALLBACK (SIZNING ROUTINGMACHINE GA MOS) =====================
  const onRouteDistanceMeters = useCallback((meters) => {
    setDistanceMeters(Number(meters) || 0);
  }, []);

  // ===================== SHOW ROUTE CONDITION =====================
  const showRoute = useMemo(() => {
    return showPricing && !!userLoc?.length && !!targetLoc?.length;
  }, [showPricing, userLoc, targetLoc]);

  // ===================== UI HELPERS =====================
  const toggleSelecting = useCallback(() => {
    setSelectingFromMap((v) => !v);
    setIsMoving(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearching((v) => !v);
  }, []);

  const onPickTarget = useCallback((latlng) => {
    setTargetLoc(latlng);
    setIsMoving(false);
  }, []);

  // ===================== RENDER =====================
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#f0f0f0",
      }}
    >
      {/* BACK BUTTON */}
      <Button
        onClick={() => navigate("/dashboard")}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1005,
          borderRadius: 14,
        }}
      >
        Orqaga
      </Button>

      {/* TOP INFO CARD */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 110,
          right: 16,
          zIndex: 1004,
          background: "#fff",
          borderRadius: 16,
          padding: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <Text type="secondary">Siz:</Text>{" "}
            <Text style={{ lineHeight: 1.2 }}>{userAddress}</Text>
          </div>

          <div>
            <Text type="secondary">Manzil:</Text>{" "}
            <Text style={{ lineHeight: 1.2 }}>{targetAddress}</Text>
          </div>

          {selectingFromMap ? (
            <Text type="secondary">
              {isMoving
                ? "Xaritani qo‘yib yuboring — manzil olinadi..."
                : "Xaritani suring — markaz manzil bo‘ladi"}
            </Text>
          ) : null}
        </div>
      </div>

      {/* MAP */}
      <MapContainer
        center={userLoc}
        zoom={16}
        zoomControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        {/* REALTIME DRIVER MARKERS */}
        {drivers.map((d) => (
          <DriverMarker key={d.id} position={[d.lat, d.lng]} />
        ))}

        {/* USER + TARGET (faqat selecting o'chirilganda) */}
        {!selectingFromMap && <UserMarker position={userLoc} />}
        {!selectingFromMap && <TargetMarker position={targetLoc} visible />}

        {/* MAP CENTER PICKER (Uber style center selection) */}
        <MapCenterPicker
          enabled={selectingFromMap}
          onPick={onPickTarget}
          onMovingChange={setIsMoving}
          onHaptic={haptic}
        />

        {/* ROUTING MACHINE */}
        {showRoute ? (
          <RoutingMachine from={userLoc} to={targetLoc} onDistanceMeters={onRouteDistanceMeters} />
        ) : null}
      </MapContainer>

      {/* UBER STYLE CENTER PIN (overlay) */}
      <CenterPin visible={selectingFromMap} isMoving={isMoving} />

      {/* SEARCH RADAR OVERLAY */}
      <SearchRadar isVisible={isSearching} />

      {/* BOTTOM DRAWER */}
      <div
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 12,
          zIndex: 1006,
          background: "#fff",
          borderRadius: 20,
          padding: 12,
          boxShadow: "0 12px 32px rgba(0,0,0,0.14)",
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Taxi buyurtma
        </Title>

        {/* BUTTONS */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Button
            type={selectingFromMap ? "primary" : "default"}
            onClick={toggleSelecting}
            style={{ flex: 1, borderRadius: 14 }}
          >
            {selectingFromMap ? "Tanlash yakunlandi" : "Xaritadan tanlash"}
          </Button>

          <Button
            loading={isSearching}
            onClick={toggleSearch}
            style={{ flex: 1, borderRadius: 14 }}
          >
            {isSearching ? "Qidirishni to‘xtatish" : "Haydovchi qidirish"}
          </Button>
        </div>

        {/* PRICE */}
        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Text>
            Masofa: <b>{distanceKm} km</b>
          </Text>

          <Text>
            Narx: <b>{priceUzs.toLocaleString("ru-RU")} so‘m</b>
          </Text>
        </div>

        {/* EXTRA CONTROLS */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Button
            onClick={() => setShowPricing((v) => !v)}
            style={{ flex: 1, borderRadius: 14 }}
          >
            {showPricing ? "Route yashirish" : "Route ko‘rsatish"}
          </Button>

          <Button
            type="primary"
            style={{ flex: 1, borderRadius: 14 }}
            disabled={!targetLoc?.length}
            onClick={() => {
              console.log("ORDER DATA:", {
                from: userLoc,
                to: targetLoc,
                price_uzs: priceUzs,
                distance_meters: distanceMeters,
                pickup: userAddress,
                dropoff: targetAddress,
              });
            }}
          >
            Buyurtma berish
          </Button>
        </div>
      </div>
    </div>
  );
}
