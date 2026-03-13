import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Typography, Drawer, Divider } from "antd";
import { useNavigate } from "react-router-dom";
import {
  MenuOutlined,
  EnvironmentOutlined,
  SettingOutlined,
  HistoryOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { setupNotifications } from "../services/notifications";
import { usePageI18n } from "./pageI18n";

// ✅ Sizdagi real map components (screenshotdagi papka)
import MapCenterPicker from "@/modules/client/features/map/components/MapCenterPicker.jsx";
import UserMarker from "@/modules/client/features/map/components/UserMarker.jsx";
import SearchRadar from "@/modules/client/features/map/components/SearchRadar.jsx";

import CenterPin from "@/modules/client/features/map/components/CenterPin.jsx";
import TargetMarker from "@/modules/client/features/map/components/TargetMarker.jsx";

import RouteLine from "@/modules/client/features/map/components/RouteLine.jsx";
import { buildRoute } from "@/providers/route/index.js";

import useRealtimeDrivers from "@/modules/driver/legacy/hooks/useRealtimeDrivers.js";
import DriverMarker from "@/modules/driver/legacy/components/DriverMarker.jsx";

const { Title, Text } = Typography;

const DEFAULT_LOC = [42.4619, 59.6166]; // fallback

export default function MainPage() {
  const navigate = useNavigate();
  const { t, tx } = usePageI18n();
  const [menuOpen, setMenuOpen] = useState(false);

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
  const [userAddress, setUserAddress] = useState(tx("loadingRoute", "Aniqlanmoqda..."));
  const [targetAddress, setTargetAddress] = useState(tx("addressNotSelected", "Manzil tanlanmagan"));

  // ===================== ROUTE STATE =====================
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [routePoints, setRoutePoints] = useState([]); // [[lat,lng], ...] for RouteLine

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

  // ===================== ROUTE (OSRM/Yandex/Google) via buildRoute =====================
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!showRoute) {
        setRoutePoints([]);
        setDistanceMeters(0);
        return;
      }
      if (!userLoc?.length || !targetLoc?.length) return;

      try {
        // MainPage uses Leaflet coords: [lat, lng]  → provider expects {lat,lng}
        const pickup = { lat: userLoc[0], lng: userLoc[1] };
        const dropoff = { lat: targetLoc[0], lng: targetLoc[1] };

        const r = await buildRoute({
          pickup,
          dropoff,
          overview: 'full',
          geometries: 'geojson',
        });

        if (cancelled) return;

        const meters = Number(r?.distance_m ?? (r?.distance_km ? r.distance_km * 1000 : 0)) || 0;
        setDistanceMeters(meters);

        // OSRM geojson: coordinates = [[lng,lat], ...]  → Leaflet wants [[lat,lng], ...]
        const coords = r?.coordinates || r?.geometry?.coordinates || r?.polyline?.coordinates || [];
        const points = Array.isArray(coords)
          ? coords.map((c) => Array.isArray(c) ? [c[1], c[0]] : c).filter((p) => Array.isArray(p) && p.length === 2)
          : [];
        setRoutePoints(points);
      } catch (e) {
        if (!cancelled) {
          console.error('[buildRoute] error:', e);
          setRoutePoints([]);
          setDistanceMeters(0);
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, [showRoute, userLoc?.[0], userLoc?.[1], targetLoc?.[0], targetLoc?.[1]]);

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

      {/* SIDE MENU (CLIENT) */}
      <Button
        type="text"
        aria-label="Menu"
        onClick={() => setMenuOpen(true)}
        icon={<MenuOutlined style={{ fontSize: 20 }} />}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1006,
          width: 44,
          height: 44,
          borderRadius: 14,
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      />

      <Drawer
        placement="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        width={300}
        bodyStyle={{ padding: 12 }}
      >
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>{t.menu || tx("menu", "Menu")}</div>
        <Divider style={{ margin: "10px 0" }} />

        <Button
          block
          icon={<UserOutlined />}
          style={{ height: 44, borderRadius: 12, textAlign: "left" }}
          onClick={() => {
            setMenuOpen(false);
            navigate("/driver-mode");
          }}
        >
          {tx("workAsDriver", "Haydovchi bo‘lib ishlash")}
        </Button>

        <Button
          block
          icon={<EnvironmentOutlined />}
          style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }}
          onClick={() => {
            setMenuOpen(false);
            navigate("/addresses");
          }}
        >
          {t.myAddresses || tx("myAddressesLabel", "Mening manzillarim")}
        </Button>

        <Button
          block
          icon={<SettingOutlined />}
          style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }}
          onClick={() => {
            setMenuOpen(false);
            navigate("/settings");
          }}
        >
          {t.settings || tx("settingsLabel", "Sozlamalar")}
        </Button>

        <Button
          block
          icon={<HistoryOutlined />}
          style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }}
          onClick={() => {
            setMenuOpen(false);
            navigate("/orders");
          }}
        >
          {tx("ordersHistoryTitle", "Buyurtmalar tarixi")}
        </Button>

        <div style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
          <Button
            block
            icon={<CustomerServiceOutlined />}
            style={{ height: 44, borderRadius: 12, textAlign: "left" }}
            onClick={() => {
              setMenuOpen(false);
              navigate("/support");
            }}
          >
            {tx("supportSection", "Qo‘llab-quvvatlash")}
          </Button>

          <Button
            danger
            block
            icon={<LogoutOutlined />}
            style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }}
            onClick={() => {
              setMenuOpen(false);
              navigate("/logout");
            }}
          >
            {t.logout || tx("logout", "Chiqish")}
          </Button>
        </div>
      </Drawer>

      {/* BACK BUTTON */}
      <Button
        onClick={() => navigate("/client")}
        style={{
          position: "absolute",
          top: 16,
          left: 72,
          zIndex: 1005,
          borderRadius: 14,
        }}
      >
        {t.back || tx("backLabel", "Orqaga")}
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
            <Text type="secondary">{tx("youLabel", "Siz")}:</Text>{" "}
            <Text style={{ lineHeight: 1.2 }}>{userAddress}</Text>
          </div>

          <div>
            <Text type="secondary">{tx("addressLabel", "Manzil")}:</Text>{" "}
            <Text style={{ lineHeight: 1.2 }}>{targetAddress}</Text>
          </div>

          {selectingFromMap ? (
            <Text type="secondary">
              {isMoving
                ? tx("dragMapRelease", "Xaritani qo‘yib yuboring — manzil olinadi...")
                : tx("dragMapMove", "Xaritani suring — markaz manzil bo‘ladi")}
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

        {/* ROUTE LINE (OSRM) */}
        {showRoute && routePoints?.length > 1 ? <RouteLine points={routePoints} /> : null}
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
          {tx("taxiOrderTitle", "Taxi buyurtma")}
        </Title>

        {/* BUTTONS */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Button
            type={selectingFromMap ? "primary" : "default"}
            onClick={toggleSelecting}
            style={{ flex: 1, borderRadius: 14 }}
          >
            {selectingFromMap ? tx("finishSelection", "Tanlash yakunlandi") : tx("pickOnMap", "Xaritadan tanlash")}
          </Button>

          <Button
            loading={isSearching}
            onClick={toggleSearch}
            style={{ flex: 1, borderRadius: 14 }}
          >
            {isSearching ? tx("stopSearch", "Qidirishni to‘xtatish") : tx("searchDriver", "Haydovchi qidirish")}
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
            {tx("distance", "Masofa")}: <b>{distanceKm} km</b>
          </Text>

          <Text>
            {tx("price", "Narx")}: <b>{priceUzs.toLocaleString("ru-RU")} {tx("som", "so‘m")}</b>
          </Text>
        </div>

        {/* EXTRA CONTROLS */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Button
            onClick={() => setShowPricing((v) => !v)}
            style={{ flex: 1, borderRadius: 14 }}
          >
            {showPricing ? tx("hideRoute", "Route yashirish") : tx("showRoute", "Route ko‘rsatish")}
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
            {tx("placeOrder", "Buyurtma berish")}
          </Button>
        </div>
      </div>
    </div>
  );
}