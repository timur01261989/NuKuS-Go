import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Button,
  Card,
  List,
  Typography,
  Tag,
  message,
  Modal,
  Row,
  Col,
  Avatar,
  Progress,
} from "antd";
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  CompassOutlined,
  FireOutlined,
  MessageOutlined,
  ThunderboltFilled,
  UserOutlined,
} from "@ant-design/icons";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../../../lib/supabase";

import ChatComponent from "../../../chat/components/ChatComponent";

const { Title, Text } = Typography;

/* =========================
   HDR overlay (shu fayl ichida)
========================= */
function HdrOverlay({
  tripStep,
  etaText,
  priceText,
  distanceText,
  title,
  subtitle,
  onChat,
  onNav,
  showNav,
}) {
  const isNight =
    typeof document !== "undefined" &&
    document.body.classList.contains("night-mode-active");

  const chipStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 999,
    background: isNight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.92)",
    border: isNight
      ? "1px solid rgba(255,255,255,0.14)"
      : "1px solid rgba(0,0,0,0.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    color: isNight ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)",
    fontWeight: 800,
    pointerEvents: "auto",
  };

  const overlayTopBar = {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    zIndex: 1200,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    pointerEvents: "none",
  };

  const leftChips = { display: "flex", gap: 10, pointerEvents: "none" };
  const rightControls = {
    display: "flex",
    gap: 10,
    pointerEvents: "none",
    alignItems: "center",
  };

  const roundBtn = {
    boxShadow: "0 10px 25px rgba(0,0,0,0.20)",
    border: "none",
    pointerEvents: "auto",
  };

  const navBtn = {
    borderRadius: 999,
    border: "none",
    pointerEvents: "auto",
    fontWeight: 900,
    background: isNight ? "rgba(0,0,0,0.75)" : "#000",
  };

  const sheet = {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 1200,
    borderRadius: 22,
    background: isNight ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.95)",
    border: isNight
      ? "1px solid rgba(255,255,255,0.14)"
      : "1px solid rgba(0,0,0,0.06)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.40)",
    overflow: "hidden",
    pointerEvents: "none",
  };

  const handle = { display: "flex", justifyContent: "center", padding: "10px 0 6px" };
  const handleBar = {
    width: 44,
    height: 5,
    borderRadius: 999,
    background: isNight ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.12)",
  };

  const body = { padding: "10px 14px 14px", pointerEvents: "auto" };
  const titleStyle = {
    margin: 0,
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: "-0.3px",
    color: isNight ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.90)",
    fontFamily: "YangoHeadline, Inter, system-ui, sans-serif",
  };
  const subStyle = {
    marginTop: 2,
    fontSize: 13,
    color: isNight ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.60)",
  };

  const stepTagColor = tripStep === 3 ? "green" : "orange";

  return (
    <>
      <div style={overlayTopBar}>
        <div style={leftChips}>
          <div style={{ ...chipStyle, pointerEvents: "auto" }}>
            <span>ETA</span>
            <span style={{ opacity: 0.75, fontWeight: 800 }}>{etaText}</span>
          </div>
          <div style={{ ...chipStyle, pointerEvents: "auto" }}>
            <span>Masofa</span>
            <span style={{ opacity: 0.75, fontWeight: 800 }}>{distanceText}</span>
          </div>
        </div>

        <div style={rightControls}>
          <div style={{ ...chipStyle, pointerEvents: "auto" }}>
            <span>Narx</span>
            <span style={{ opacity: 0.75, fontWeight: 900 }}>{priceText}</span>
          </div>

          <Button
            shape="circle"
            size="large"
            icon={<MessageOutlined />}
            onClick={onChat}
            style={roundBtn}
          />

          {showNav && (
            <Button
              shape="round"
              icon={<CompassOutlined />}
              type="primary"
              onClick={onNav}
              style={navBtn}
            >
              NAVIGATOR
            </Button>
          )}
        </div>
      </div>

      <div style={sheet}>
        <div style={handle}>
          <div style={handleBar} />
        </div>
        <div style={body}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <Tag color={stepTagColor} style={{ borderRadius: 8, fontWeight: "bold" }}>
              {tripStep === 1 ? "MIJOZGA BORILMOQDA" : tripStep === 2 ? "KUTILMOQDA" : "YUKLANDI"}
            </Tag>
          </div>

          <div style={titleStyle}>{title}</div>
          <div style={subStyle}>{subtitle}</div>
        </div>
      </div>
    </>
  );
}

const getMapStyle = () => {
  const hour = new Date().getHours();
  const isNightHour = hour >= 20 || hour < 6;

  const isNightClass =
    typeof document !== "undefined" &&
    document.body.classList.contains("night-mode-active");

  const isNight = isNightHour || isNightClass;

  if (isNight) {
    return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  }

  return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
};

/* =========================
   ICONS
========================= */
const clientIcon = L.divIcon({
  html: '<div style="font-size: 30px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🙋‍♂️</div>',
  className: "custom-client-icon",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const carIcon = L.divIcon({
  html: `<div class="smooth-car-marker" style="font-size: 35px; transform-origin: center;">🚖</div>`,
  className: "custom-car-icon",
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

/* =========================
   VOICE
========================= */
const playVoiceNote = (text) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "uz-UZ";
    window.speechSynthesis.speak(utterance);
  }
};

/* =========================
   DISTANCE
========================= */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* =========================
   ROUTING MACHINE
========================= */
function RoutingMachine({ from, to, color = "#1890ff" }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !from || !to) return;

    map.eachLayer((l) => {
      if (l && l.options && l.options.name === "route-line") {
        try {
          map.removeLayer(l);
        } catch (e) {}
      }
    });

    const control = L.Routing.control({
      waypoints: [L.latLng(from), L.latLng(to)],
      lineOptions: {
        styles: [
          { color: color, weight: 10, opacity: 0.22 },
          {
            color: color,
            weight: 6,
            opacity: 0.9,
            dashArray: color === "#52c41a" ? "10, 10" : "",
          },
        ],
      },
      createMarker: () => null,
      addWaypoints: false,
      show: false,
      router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1" }),
    }).addTo(map);

    control.getPlan().options.name = "route-line";

    return () => {
      try {
        map.removeControl(control);
      } catch (e) {}
    };
  }, [map, from, to, color]);

  return null;
}

/* =========================
   HELPERS
========================= */
const parseLoc = (str) => {
  const parts = str?.match(/[\d.]+/g);
  return parts ? [parseFloat(parts[0]), parseFloat(parts[1])] : [0, 0];
};

const openNavigatorTo = (destination) => {
  const lat = destination[0];
  const lon = destination[1];

  const uri = `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`;
  window.location.href = uri;

  setTimeout(() => {
    if (document.hasFocus()) {
      window.open(`https://yandex.uz/maps/?rtext=~${lat},${lon}`, "_blank");
    }
  }, 1500);
};

/* =========================
   STEP 0 VIEW (Orders list)
   ✅ alohida component: hook buzilmaydi
========================= */
function OrdersStepView({
  onBack,
  activeOrders,
  acceptOrder,
  dailyEarnings,
  activityPoints,
}) {
  return (
    <div style={{ padding: 15, background: "#f0f2f5", minHeight: "100vh" }}>
      <Card
        style={{
          borderRadius: 20,
          marginBottom: 15,
          background: "#000",
          color: "#fff",
          border: "none",
        }}
      >
        <Row align="middle" justify="space-between">
          <Col span={14}>
            <Text style={{ color: "#aaa", fontSize: 12 }}>BUGUNGI DAROMAD</Text>
            <Title level={3} style={{ color: "#FFD700", margin: 0 }}>
              {dailyEarnings.total.toLocaleString()} so'm
            </Title>
          </Col>
          <Col span={10} style={{ textAlign: "right" }}>
            <Tag
              color="orange"
              icon={<ThunderboltFilled />}
              style={{ borderRadius: 8 }}
            >
              {activityPoints} Faollik
            </Tag>
            <div style={{ marginTop: 5, color: "#aaa", fontSize: 12 }}>
              {dailyEarnings.count} ta safar
            </div>
          </Col>
        </Row>
      </Card>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 15 }}>
        <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={onBack} />
        <Title
          level={4}
          style={{ margin: "0 0 0 15px", fontFamily: "YangoHeadline" }}
        >
          Buyurtmalar
        </Title>
      </div>

      <List
        dataSource={activeOrders}
        renderItem={(item) => (
          <Card
            hoverable
            style={{ marginBottom: 12, borderRadius: 20, border: "none" }}
            onClick={() => acceptOrder(item)}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text strong style={{ fontSize: 16 }}>
                {item.pickup_location?.slice(0, 30)}...
              </Text>
              <Tag color="green" style={{ borderRadius: 8 }}>
                {parseInt(item.price).toLocaleString()} so'm
              </Tag>
            </div>

            <Button
              type="primary"
              block
              style={{
                marginTop: 15,
                background: "#000",
                borderRadius: 12,
                height: 45,
                fontWeight: 700,
              }}
              onClick={(e) => {
                e.stopPropagation();
                acceptOrder(item);
              }}
            >
              QABUL QILISH
            </Button>
          </Card>
        )}
      />
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function DriverTaxi({ onBack }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState([42.4619, 59.6166]);
  const [tripStep, setTripStep] = useState(0);

  const [waitTime, setWaitTime] = useState(0);
  const waitTimerRef = useRef(null);

  const [chatVisible, setChatVisible] = useState(false);
  const [driverId, setDriverId] = useState(null);

  const [dailyEarnings, setDailyEarnings] = useState({ total: 0, count: 0 });
  const [activityPoints, setActivityPoints] = useState(100);

  const [totalTraveledDist, setTotalTraveledDist] = useState(0);
  const lastPositionRef = useRef(null);

  const [nextOrder, setNextOrder] = useState(null);
  const [offerVisible, setOfferVisible] = useState(false);
  const [offerTimeLeft, setOfferTimeLeft] = useState(15);
  const offerTimerRef = useRef(null);

  const WAIT_FREE_LIMIT = 120;
  const WAIT_PRICE_PER_MIN = 500;

  const paidWaitSeconds = Math.max(0, waitTime - WAIT_FREE_LIMIT);
  const waitCost =
    Math.max(0, Math.ceil(paidWaitSeconds / 60)) * WAIT_PRICE_PER_MIN;

  const pickupCoords = useMemo(
    () => parseLoc(currentOrder?.pickup_location),
    [currentOrder]
  );
  const dropoffCoords = useMemo(
    () => parseLoc(currentOrder?.dropoff_location),
    [currentOrder]
  );

  const currentPriceDisplay = useMemo(() => {
    const base = currentOrder?.price || 0;
    const distancePrice = Math.ceil((totalTraveledDist * 2000) / 500) * 500;
    return Math.max(base, distancePrice) + waitCost;
  }, [currentOrder, totalTraveledDist, waitCost]);

  // ✅ Hooklar doim bir xil tartibda:
  const routeColor = useMemo(() => {
    if (tripStep === 1) return "#52c41a";
    if (tripStep === 3) return "#00f2ff";
    return "#1890ff";
  }, [tripStep]);

  const overlayTitle = useMemo(() => {
    if (tripStep === 1) return "Mijozga boryapsiz";
    if (tripStep === 2) return "Mijoz kutilmoqda";
    if (tripStep === 3) return "Safar jarayonda";
    if (tripStep === 4) return "Safar yakunlandi";
    return "Buyurtma";
  }, [tripStep]);

  const overlaySubtitle = useMemo(() => {
    if (tripStep === 1) return "Pickup nuqtasiga yo‘l";
    if (tripStep === 2) return "Mijozni kutyapsiz";
    if (tripStep === 3)
      return `Joriy hisob: ${currentPriceDisplay.toLocaleString()} so'm`;
    if (tripStep === 4)
      return `Yakuni: ${currentPriceDisplay.toLocaleString()} so'm`;
    return "Tafsilotlar";
  }, [tripStep, currentPriceDisplay]);

  const navTarget = tripStep === 1 ? pickupCoords : dropoffCoords;

  useEffect(() => {
    const initDriver = async () => {
      const {
        data: { user },
        error,
      } = supabase.auth.getSession();

      if (error) console.error(error);

      if (user) {
        setDriverId(user.id);
        fetchDailyStats(user.id);
        fetchActivityPoints(user.id);
      }
    };
    initDriver();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDailyStats = async (uid) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("orders")
        .select("price")
        .eq("driver_id", uid)
        .eq("status", "completed")
        .gte("created_at", today);

      if (error) throw error;

      if (data) {
        const total = data.reduce((sum, item) => sum + (item.price || 0), 0);
        setDailyEarnings({ total, count: data.length });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchActivityPoints = async (uid) => {
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("activity_points")
        .eq("id", uid)
        .single();

      if (error) throw error;
      if (data) setActivityPoints(data.activity_points || 100);
    } catch (e) {
      console.error(e);
    }
  };

  const updateActivity = async (points) => {
    const newPoints = activityPoints + points;
    setActivityPoints(newPoints);

    try {
      if (driverId) {
        const { error } = await supabase
          .from("drivers")
          .update({ activity_points: newPoints })
          .eq("id", driverId);
        if (error) throw error;
      }
    } catch (e) {
      console.error(e);
    }

    if (points < 0) message.warning(`Faollik balingiz tushdi: ${points}`);
  };

  // Geolocation watch
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];

        if (tripStep === 3) {
          if (lastPositionRef.current) {
            const d = getDistance(
              lastPositionRef.current[0],
              lastPositionRef.current[1],
              newPos[0],
              newPos[1]
            );
            if (d > 0.03) setTotalTraveledDist((prev) => prev + d);
          }
          lastPositionRef.current = newPos;
        }

        setDriverLocation(newPos);

        try {
          if (driverId) {
            const { error } = await supabase
              .from("drivers")
              .update({
                current_lat: pos.coords.latitude,
                current_lng: pos.coords.longitude,
                last_updated: new Date().toISOString(),
              })
              .eq("id", driverId);

            if (error) throw error;
          }
        } catch (e) {
          console.error(e);
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [driverId, tripStep]);

  // Orders realtime
  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("taxi-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("service_type", "taxi")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setActiveOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  const acceptOrder = async (order) => {
    try {
      if (!driverId) {
        message.error("Driver ID topilmadi. Qayta login qiling.");
        return;
      }
      if (!order?.id) {
        message.error("Order ID yo‘q.");
        return;
      }

      const { error } = await supabase
        .from("orders")
        .update({ status: "accepted", driver_id: driverId })
        .eq("id", order.id);

      if (error) throw error;

      setCurrentOrder(order);
      setTripStep(1);
      playVoiceNote("Buyurtma qabul qilindi.");
    } catch (e) {
      console.error(e);
      message.error("Qabul qilishda xatolik (server 400 bo‘lishi mumkin).");
    }
  };

  const arrivedAtPickup = async () => {
    try {
      if (!currentOrder?.id) return;

      const { error } = await supabase
        .from("orders")
        .update({ status: "arrived" })
        .eq("id", currentOrder.id);

      if (error) throw error;

      setTripStep(2);
      setWaitTime(0);
      playVoiceNote("Mijoz kutilmoqda.");

      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
      waitTimerRef.current = setInterval(
        () => setWaitTime((prev) => prev + 1),
        1000
      );
    } catch (e) {
      console.error(e);
      message.error("Yetib keldim bosqichida xatolik.");
    }
  };

  const startTrip = async () => {
    try {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
      if (!currentOrder?.id) return;

      const { error } = await supabase
        .from("orders")
        .update({ status: "in_progress" })
        .eq("id", currentOrder.id);

      if (error) throw error;

      setTripStep(3);
      setTotalTraveledDist(0);
      lastPositionRef.current = driverLocation;
      playVoiceNote("Safar boshlandi.");
    } catch (e) {
      console.error(e);
      message.error("Safarni boshlashda xatolik.");
    }
  };

  const checkForChainOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending");

      if (error) throw error;

      if (data && data.length > 0) {
        const nearest = data.find((o) => {
          const p = parseLoc(o.pickup_location);
          return getDistance(
            driverLocation[0],
            driverLocation[1],
            p[0],
            p[1]
          ) < 3;
        });

        if (nearest) {
          setNextOrder(nearest);
          setOfferVisible(true);
          setOfferTimeLeft(15);
          return;
        }
      }

      setTripStep(4);
    } catch (e) {
      console.error(e);
      setTripStep(4);
    }
  };

  const finishTrip = async () => {
    try {
      if (!currentOrder?.id) return;

      const distancePrice = Math.ceil((totalTraveledDist * 2000) / 500) * 500;
      const basePrice = currentOrder?.price || 0;
      const finalPrice = Math.max(basePrice, distancePrice) + waitCost;

      const { error } = await supabase
        .from("orders")
        .update({ status: "completed", price: finalPrice })
        .eq("id", currentOrder.id);

      if (error) throw error;

      playVoiceNote("Safar yakunlandi.");
      updateActivity(2);
      if (driverId) fetchDailyStats(driverId);

      checkForChainOrder();
    } catch (e) {
      console.error(e);
      message.error("Safarni yakunlashda xatolik.");
    }
  };

  const cancelActiveOrder = async () => {
    try {
      if (!currentOrder?.id) return;

      const { error } = await supabase
        .from("orders")
        .update({ status: "pending", driver_id: null })
        .eq("id", currentOrder.id);

      if (error) throw error;

      updateActivity(-10);
      setTripStep(0);
      setCurrentOrder(null);
      message.error("Buyurtma bekor qilindi, faollik tushdi.");
    } catch (e) {
      console.error(e);
      message.error("Bekor qilishda xatolik.");
    }
  };

  // Offer countdown
  useEffect(() => {
    if (!offerVisible) return;

    if (offerTimerRef.current) clearInterval(offerTimerRef.current);

    offerTimerRef.current = setInterval(() => {
      setOfferTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(offerTimerRef.current);
          offerTimerRef.current = null;
          setOfferVisible(false);
          setNextOrder(null);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (offerTimerRef.current) clearInterval(offerTimerRef.current);
      offerTimerRef.current = null;
    };
  }, [offerVisible]);

  const handleAcceptNext = async () => {
    if (offerTimerRef.current) clearInterval(offerTimerRef.current);
    offerTimerRef.current = null;

    setOfferVisible(false);

    if (nextOrder) acceptOrder(nextOrder);
  };

  // Cleanup wait timer
  useEffect(() => {
    return () => {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    };
  }, []);

  // ✅ STEP 0 render (endilikda hooks buzilmaydi)
  if (tripStep === 0) {
    return (
      <OrdersStepView
        onBack={onBack}
        activeOrders={activeOrders}
        acceptOrder={acceptOrder}
        dailyEarnings={dailyEarnings}
        activityPoints={activityPoints}
      />
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={driverLocation}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
  url={getMapStyle()}
  attribution='&copy; OpenStreetMap contributors &copy; CARTO'
/>

          <Marker position={driverLocation} icon={carIcon} />
          {tripStep === 1 && <Marker position={pickupCoords} icon={clientIcon} />}

          {(tripStep === 1 || tripStep === 3) && (
            <RoutingMachine
              from={driverLocation}
              to={tripStep === 1 ? pickupCoords : dropoffCoords}
              color={routeColor}
            />
          )}
        </MapContainer>

        <HdrOverlay
          tripStep={tripStep}
          etaText={"—"}
          distanceText={tripStep === 3 ? `${totalTraveledDist.toFixed(1)} km` : "—"}
          priceText={`${currentPriceDisplay.toLocaleString()} so'm`}
          title={overlayTitle}
          subtitle={overlaySubtitle}
          onChat={() => setChatVisible(true)}
          onNav={() => openNavigatorTo(navTarget)}
          showNav={tripStep === 1 || tripStep === 3}
        />
      </div>

      <div
        style={{
          background: "#fff",
          padding: "20px 15px",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -5px 25px rgba(0,0,0,0.1)",
          zIndex: 1001,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 15 }}>
          <Tag
            color={tripStep === 3 ? "green" : "orange"}
            style={{ borderRadius: 6, fontWeight: "bold" }}
          >
            {tripStep === 1 ? "MIJOZGA BORILMOQDA" : tripStep === 2 ? "KUTILMOQDA" : "YUKLANDI"}
          </Tag>
        </div>

        {tripStep < 4 && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar
                  size={50}
                  style={{ backgroundColor: "#FFD700" }}
                  icon={<UserOutlined style={{ color: "#000" }} />}
                />
                <div>
                  <Title level={5} style={{ margin: 0, fontFamily: "YangoHeadline" }}>
                    {currentOrder?.client_name || "Yo'lovchi"}
                  </Title>
                  <Text type="secondary">5.0 ★</Text>
                </div>
              </div>
              <Button
                shape="circle"
                size="large"
                icon={<PhoneOutlined />}
                style={{ background: "#f5f5f5", color: "#000", border: "none" }}
              />
            </div>

            {tripStep === 3 && (
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 15,
                  background: "#f9f9f9",
                  padding: "10px",
                  borderRadius: "12px",
                }}
              >
                <Text type="secondary">Joriy hisob:</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {currentPriceDisplay.toLocaleString()} so'm
                </Title>
                <Text style={{ fontSize: 10 }}>
                  Masofa: {totalTraveledDist.toFixed(1)} km
                </Text>
              </div>
            )}
          </>
        )}

        {tripStep === 1 && (
          <Row gutter={10}>
            <Col span={16}>
              <Button
                type="primary"
                block
                size="large"
                onClick={arrivedAtPickup}
                style={{
                  height: 60,
                  borderRadius: 16,
                  background: "#000",
                  fontWeight: 800,
                }}
              >
                YETIB KELDIM
              </Button>
            </Col>
            <Col span={8}>
              <Button
                block
                size="large"
                danger
                onClick={cancelActiveOrder}
                style={{ height: 60, borderRadius: 16 }}
              >
                BEKOR
              </Button>
            </Col>
          </Row>
        )}

        {tripStep === 2 && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 15,
                background: "#f9f9f9",
                padding: 15,
                borderRadius: 12,
              }}
            >
              <div>
                <Text type="secondary">Kutish vaqti:</Text>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: paidWaitSeconds > 0 ? "#ff4d4f" : "#52c41a",
                  }}
                >
                  {Math.floor(waitTime / 60)}:{String(waitTime % 60).padStart(2, "0")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Text type="secondary">Kutish haqi:</Text>
                <div style={{ fontSize: 20, fontWeight: "bold" }}>
                  {waitCost.toLocaleString()}
                </div>
              </div>
            </div>

            <Button
              type="primary"
              block
              size="large"
              onClick={startTrip}
              style={{
                height: 60,
                borderRadius: 16,
                background: "#52c41a",
                border: "none",
                fontWeight: 800,
              }}
            >
              KETDIK!
            </Button>
          </div>
        )}

        {tripStep === 3 && (
          <Button
            type="primary"
            block
            size="large"
            danger
            onClick={finishTrip}
            style={{ height: 60, borderRadius: 16, fontWeight: 800 }}
          >
            SAFARNI YAKUNLASH
          </Button>
        )}

        {tripStep === 4 && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <CheckCircleOutlined
              style={{ fontSize: 50, color: "#52c41a", marginBottom: 10 }}
            />
            <Title level={2} style={{ margin: 0 }}>
              {currentPriceDisplay.toLocaleString()} so'm
            </Title>
            <Button
              block
              size="large"
              style={{
                marginTop: 20,
                borderRadius: 16,
                height: 55,
                background: "#000",
                color: "#fff",
              }}
              onClick={() => {
                setTripStep(0);
                setCurrentOrder(null);
              }}
            >
              BOSH SAHIFA
            </Button>
          </div>
        )}
      </div>

      <ChatComponent
        orderId={currentOrder?.id}
        userId={driverId}
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
      />

      <Modal
        open={offerVisible}
        footer={null}
        closable={false}
        centered
        width={320}
        bodyStyle={{ textAlign: "center", padding: 25, borderRadius: 20 }}
      >
        <Title level={4} style={{ color: "#faad14" }}>
          <FireOutlined /> ZANJIR BUYURTMA!
        </Title>

        <Progress
          type="circle"
          percent={(offerTimeLeft / 15) * 100}
          format={() => `${offerTimeLeft}s`}
          strokeColor="#faad14"
          width={70}
        />

        <div
          style={{
            textAlign: "left",
            background: "#f9f9f9",
            padding: 15,
            borderRadius: 12,
            margin: "20px 0",
          }}
        >
          <Text strong>{nextOrder?.pickup_location?.slice(0, 30)}...</Text>
          <div style={{ marginTop: 5, color: "green", fontWeight: "bold" }}>
            {nextOrder?.price ? parseInt(nextOrder.price).toLocaleString() : "—"} so'm
          </div>
        </div>

        <Row gutter={10}>
          <Col span={12}>
            <Button block size="large" onClick={() => setOfferVisible(false)}>
              Rad etish
            </Button>
          </Col>
          <Col span={12}>
            <Button
              type="primary"
              block
              size="large"
              style={{ background: "#000" }}
              onClick={handleAcceptNext}
            >
              Qabul qilish
            </Button>
          </Col>
        </Row>
      </Modal>

      <style>{`
        .leaflet-marker-icon { transition: transform 1.2s linear !important; }
        .ant-btn:active { transform: scale(0.96); }
      `}</style>
    </div>
  );
}
