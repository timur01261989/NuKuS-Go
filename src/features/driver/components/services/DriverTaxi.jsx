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
  Badge,
  Skeleton
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
  CarOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";

// Leaflet xaritalari
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";

// Supabase ulanishi
import { supabase } from "../../../../lib/supabase"; 

// Agar Chat komponentingiz bo'lsa, yo'lini to'g'rilang yoki o'chirib turing
// import ChatComponent from "../../../chat/components/ChatComponent";

const { Title, Text } = Typography;

/* =========================
   HDR OVERLAY (Yandex Go uslubidagi panel)
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
  const isNight = false; // Tungi rejim logikasi kerak bo'lsa qo'shish mumkin

  const chipStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.95)",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    color: "#000",
    fontWeight: 700,
    fontSize: 13,
    pointerEvents: "auto",
  };

  const overlayTopBar = {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    pointerEvents: "none",
  };

  const sheet = {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 20,
    zIndex: 1000,
    borderRadius: 22,
    background: "rgba(255,255,255,0.98)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    padding: "16px",
    pointerEvents: "none", // Ichidagi elementlar auto bo'ladi
  };

  const stepColors = { 1: "orange", 2: "blue", 3: "green", 4: "black" };
  const stepText = { 1: "MIJOZGA BORISH", 2: "KUTISH", 3: "SAFARDA", 4: "YAKUN" };

  return (
    <>
      {/* Yuqori Panel */}
      <div style={overlayTopBar}>
        <div style={{ display: "flex", gap: 8 }}>
          {distanceText && (
             <div style={chipStyle}>
               <CompassOutlined /> {distanceText}
             </div>
          )}
        </div>
        
        <div style={{ display: "flex", gap: 8 }}>
          <div style={chipStyle}>
            {priceText}
          </div>
          <Button 
            shape="circle" 
            icon={<MessageOutlined />} 
            style={{ pointerEvents: 'auto', boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
            onClick={onChat}
          />
          {showNav && (
            <Button 
              type="primary" 
              shape="circle" 
              icon={<EnvironmentOutlined />} 
              style={{ pointerEvents: 'auto', background: '#000', borderColor: '#000' }}
              onClick={onNav}
            />
          )}
        </div>
      </div>

      {/* Pastki Info Panel */}
      <div style={sheet}>
         <div style={{ pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
               <Tag color={stepColors[tripStep] || 'default'} style={{ fontWeight: 800 }}>
                  {stepText[tripStep] || "Status"}
               </Tag>
            </div>
            <Title level={5} style={{ margin: 0, textAlign: 'center' }}>{title}</Title>
            <div style={{ textAlign: 'center', color: '#888', fontSize: 13 }}>{subtitle}</div>
         </div>
      </div>
    </>
  );
}

/* =========================
   MAP ICONS & STYLES
========================= */
// Xarita stili (CartoDB Voyager - toza va chiroyli)
const MAP_TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

const clientIcon = L.divIcon({
  html: '<div style="font-size: 35px; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3));">🙋‍♂️</div>',
  className: "custom-client-icon",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const carIcon = L.divIcon({
  html: '<div style="font-size: 40px; transform: rotate(0deg);">🚖</div>', // Rasmni burish logikasi qo'shish mumkin
  className: "custom-car-icon",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

/* =========================
   ROUTING ENGINE (Yo'l chizish)
========================= */
function RoutingMachine({ from, to, color = "#1890ff" }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !from || !to) return;

    // Eski yo'nalishlarni o'chirish
    map.eachLayer((layer) => {
       if (layer.options && layer.options.role === 'route') {
          map.removeLayer(layer);
       }
    });

    const control = L.Routing.control({
      waypoints: [L.latLng(from), L.latLng(to)],
      lineOptions: {
        styles: [{ color: color, weight: 6, opacity: 0.8 }]
      },
      show: false, // Matnli yo'riqnomani yashirish
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null, // Markerlarni biz o'zimiz qo'yamiz
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1"
      })
    }).addTo(map);

    // Xarita chegaralarini moslashtirish
    const bounds = L.latLngBounds([from, to]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      try {
        map.removeControl(control);
      } catch (e) {}
    };
  }, [map, from, to, color]);

  return null;
}

/* =========================
   UTILITIES
========================= */
const parseLoc = (str) => {
  if (!str) return [41.2995, 69.2401]; // Default Tashkent
  const parts = str.match(/[\d.]+/g);
  return parts && parts.length >= 2 ? [parseFloat(parts[0]), parseFloat(parts[1])] : [41.2995, 69.2401];
};

const openNavigatorTo = (loc) => {
  const [lat, lng] = loc;
  // Yandex Navigator yoki Google Maps ochish
  window.open(`https://yandex.uz/maps/?rtext=~${lat},${lng}&rtt=auto`, "_blank");
};

const playVoice = (text) => {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'uz-UZ'; // Yoki ru-RU
    window.speechSynthesis.speak(u);
  }
};

/* =========================
   MAIN COMPONENT
========================= */
export default function DriverTaxi({ onBack }) {
  // --- STATE ---
  const [driverId, setDriverId] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
const hasOrder = () => {
  if (!currentOrder?.id) {
    message.error("Buyurtma topilmadi");
    return false;
  }
  return true;
};

  
  // 0: List, 1: Pickupga borish, 2: Kutish, 3: Safarda, 4: Yakun
  const [tripStep, setTripStep] = useState(0); 
  
  const [driverLocation, setDriverLocation] = useState([41.2995, 69.2401]);
  const [totalDist, setTotalDist] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  
  // Zanjir buyurtma
  const [nextOrder, setNextOrder] = useState(null);
  const [offerVisible, setOfferVisible] = useState(false);
  const [offerTimer, setOfferTimer] = useState(15);
  const timerRef = useRef(null);
  const waitIntervalRef = useRef(null);

  // Statistika
  const [dailyStats, setDailyStats] = useState({ sum: 0, count: 0 });

  // --- INIT ---
  useEffect(() => {
    checkSession();
    // Realtime orders
    const channel = supabase.channel('taxi_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
         fetchOrders();
      })
      .subscribe();

    // Geolocation watch
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setDriverLocation([latitude, longitude]);
          // Bazaga update qilish (ixtiyoriy, dispetcher ko'rishi uchun)
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
      return () => {
        navigator.geolocation.clearWatch(watchId);
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const checkSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setDriverId(user.id);
      fetchOrders();
      fetchStats(user.id);
    } else {
      message.error("Iltimos, avval tizimga kiring");
      onBack();
    }
  };

  const fetchOrders = async () => {
    // Faqat shahar taksi buyurtmalari (service_type='taxi') va haydovchisi yo'q (pending)
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("service_type", "taxi") 
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setActiveOrders(data || []);
  };

  const fetchStats = async (uid) => {
    // Bugungi statistika
    const startOfDay = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from("orders")
      .select("price")
      .eq("driver_id", uid)
      .eq("status", "completed")
      .gte("created_at", startOfDay);
    
    if (data) {
      const sum = data.reduce((acc, cur) => acc + (cur.price || 0), 0);
      setDailyStats({ sum, count: data.length });
    }
  };

  // --- ACTIONS ---

  const acceptOrder = async (order) => {
    if (!driverId) return message.error("Haydovchi aniqlanmadi");
    
    try {
      // 1. Bazada statusni o'zgartiramiz va driver_id ni biriktiramiz
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "accepted", 
          driver_id: driverId // <--- SQL kod orqali qo'shgan ustunimiz shu yerda ishlatiladi
        })
        .eq("id", order.id);

      if (error) throw error;

      setCurrentOrder(order);
      setTripStep(1); // Pickupga borish
      playVoice("Buyurtma qabul qilindi. Mijozga boring.");

    } catch (e) {
      console.error(e);
      message.error("Qabul qilishda xatolik: " + e.message);
    }
  };

  const arrivedAtPickup = async () => {
    if (!hasOrder()) return;

    await supabase.from("orders").update({ status: "arrived" }).eq("id", currentOrder.id);
    setTripStep(2); // Kutish
    setWaitTime(0);
    playVoice("Manzilga yetib keldingiz. Mijoz kutilmoqda.");

    // Kutish taymeri
    waitIntervalRef.current = setInterval(() => {
      setWaitTime(p => p + 1);
    }, 1000);
  };

  const startRide = async () => {
    if (!hasOrder()) return;

    clearInterval(waitIntervalRef.current);
    await supabase.from("orders").update({ status: "in_progress" }).eq("id", currentOrder.id);
    setTripStep(3); // Safarda
    setTotalDist(0);
    playVoice("Safar boshlandi. Haydovchi, oq yo'l.");
  };

  const completeRide = async () => {
    if (!hasOrder()) return;

    // Narx hisoblash: Baza narxi + (Masofa * 2000 so'm) + (Kutish * 500 so'm)
    // Bu shunchaki misol logika
    const distanceCost = Math.floor(totalDist * 2000); 
    const waitCost = Math.floor((waitTime / 60) * 500); 
    const finalPrice = (currentOrder.price || 5000) + distanceCost + waitCost;

    await supabase
      .from("orders")
      .update({ status: "completed", price: finalPrice })
      .eq("id", currentOrder.id);

    message.success(`Safar yakunlandi! Narx: ${finalPrice} so'm`);
    playVoice("Safar yakunlandi.");
    
    // Zanjir (Chain) tekshirish
    checkChainOrder();
    
    setTripStep(4); // Yakuniy ekran
    fetchStats(driverId);
  };

  const checkChainOrder = () => {
    // Agar activeOrders ichida yaqin buyurtma bo'lsa, taklif qilish
    if (activeOrders.length > 0) {
      setNextOrder(activeOrders[0]);
      setOfferVisible(true);
      setOfferTimer(15);
      
      timerRef.current = setInterval(() => {
        setOfferTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setOfferVisible(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const closeChainOffer = () => {
    clearInterval(timerRef.current);
    setOfferVisible(false);
    setNextOrder(null);
    // Agar hozir 4-bosqichda bo'lsak va rad etsak -> Bosh sahifa
    if (tripStep === 4) {
       resetToHome();
    }
  };

  const acceptChainOrder = () => {
    clearInterval(timerRef.current);
    setOfferVisible(false);
    if (nextOrder) {
      acceptOrder(nextOrder); // Yangisini boshlash
    }
  };

  const resetToHome = () => {
    setCurrentOrder(null);
    setTripStep(0);
    setWaitTime(0);
    setTotalDist(0);
  };

  // --- VIEW HELPERS ---
  const getPickupLoc = () => parseLoc(currentOrder?.pickup_location);
  const getDropoffLoc = () => parseLoc(currentOrder?.dropoff_location);

  // Narxni dinamik hisoblash (vizual)
  const dynamicPrice = useMemo(() => {
     if (!currentOrder) return 0;
     const base = currentOrder.price || 0;
     const wait = Math.floor((waitTime / 60) * 500);
     return base + wait;
  }, [currentOrder, waitTime]);


  // --- RENDER STEP 0: ORDERS LIST ---
  if (tripStep === 0) {
    return (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={onBack} />
          <Title level={4} style={{ margin: 0 }}>Faol Buyurtmalar</Title>
          <Badge count={activeOrders.length}>
             <Button icon={<CarOutlined />} shape="circle" />
          </Badge>
        </div>

        {/* Info Card */}
        <Card style={{ borderRadius: 16, background: '#000', color: '#fff', marginBottom: 20, border: 'none' }}>
           <Row gutter={16} align="middle">
              <Col span={12}>
                 <Text style={{ color: '#888' }}>Bugungi daromad</Text>
                 <Title level={3} style={{ color: '#fff', margin: 0 }}>{dailyStats.sum.toLocaleString()} so'm</Title>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                 <Tag color="gold" icon={<ThunderboltFilled />}>{dailyStats.count} ta safar</Tag>
              </Col>
           </Row>
        </Card>

        {/* Orders List */}
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={activeOrders}
          renderItem={item => (
            <List.Item>
              <Card 
                hoverable 
                style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                onClick={() => acceptOrder(item)}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Title level={5} style={{ margin: 0 }}>{item.pickup_location?.split(',')[0] || "Lokatsiya"}</Title>
                    <Title level={5} style={{ margin: 0, color: 'green' }}>{item.price?.toLocaleString()} so'm</Title>
                 </div>
                 <div style={{ color: '#888', margin: '5px 0' }}>
                    <EnvironmentOutlined /> {item.pickup_location}
                 </div>
                 <Button type="primary" block style={{ marginTop: 10, background: '#000', borderRadius: 12 }}>Qabul qilish</Button>
              </Card>
            </List.Item>
          )}
        />
        {activeOrders.length === 0 && <Skeleton active />}
      </div>
    );
  }

  // --- RENDER STEPS 1-4: MAP MODE ---
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", position: 'relative' }}>
      
      {/* MAP */}
      <div style={{ flex: 1 }}>
        <MapContainer
          center={driverLocation}
          zoom={16}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url={MAP_TILE_URL} />
          
          <Marker position={driverLocation} icon={carIcon} />
          
          {(tripStep === 1 || tripStep === 2) && (
            <Marker position={getPickupLoc()} icon={clientIcon} />
          )}
          
          {tripStep === 3 && (
            <Marker position={getDropoffLoc()} icon={clientIcon} />
          )}

          {/* Navigatsiya chizig'i */}
          <RoutingMachine 
            from={driverLocation} 
            to={tripStep === 1 ? getPickupLoc() : getDropoffLoc()} 
            color={tripStep === 1 ? '#faad14' : '#52c41a'} 
          />
        </MapContainer>
      </div>

      {/* OVERLAYS */}
      <HdrOverlay 
         tripStep={tripStep}
         etaText="5 daqiqa"
         distanceText={tripStep === 3 ? `${(totalDist + 1.2).toFixed(1)} km` : null}
         priceText={`${dynamicPrice.toLocaleString()} so'm`}
         title={currentOrder?.pickup_location || "Manzil"}
         subtitle={tripStep === 2 ? `Kutish: ${Math.floor(waitTime/60)}:${waitTime%60}` : "Mijoz bilan aloqa"}
         onChat={() => message.info("Chat ochilmoqda...")}
         showNav={tripStep === 1 || tripStep === 3}
         onNav={() => openNavigatorTo(tripStep === 1 ? getPickupLoc() : getDropoffLoc())}
      />

      {/* BOTTOM ACTION PANEL */}
      <div style={{ 
         background: '#fff', 
         padding: '20px 16px 30px', 
         borderRadius: '24px 24px 0 0', 
         boxShadow: '0 -10px 30px rgba(0,0,0,0.1)',
         zIndex: 1001,
         position: 'relative'
      }}>
         
         {/* User Info */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <Avatar size={48} icon={<UserOutlined />} style={{ background: '#f0f0f0', color: '#000' }} />
               <div>
                  <Title level={5} style={{ margin: 0 }}>Mijoz</Title>
                  <Text type="secondary">Naqd to'lov</Text>
               </div>
            </div>
            <Button shape="circle" size="large" icon={<PhoneOutlined />} />
         </div>

         {/* Buttons based on Step */}
         {tripStep === 1 && (
            <Button type="primary" block size="large" style={{ height: 56, borderRadius: 16, background: '#faad14', fontSize: 18, fontWeight: 700 }} onClick={arrivedAtPickup}>
               YETIB KELDIM
            </Button>
         )}

         {tripStep === 2 && (
            <Row gutter={10}>
               <Col span={24}>
                  <Button type="primary" block size="large" style={{ height: 56, borderRadius: 16, background: '#52c41a', fontSize: 18, fontWeight: 700 }} onClick={startRide}>
                     KETDIK (BOSHLASH)
                  </Button>
               </Col>
            </Row>
         )}

         {tripStep === 3 && (
            <Button type="primary" block size="large" danger style={{ height: 56, borderRadius: 16, fontSize: 18, fontWeight: 700 }} onClick={completeRide}>
               SAFARNI YAKUNLASH
            </Button>
         )}

         {tripStep === 4 && (
            <Button block size="large" onClick={resetToHome} style={{ height: 56, borderRadius: 16 }}>
               BOSH SAHIFA
            </Button>
         )}
      </div>

      {/* CHAIN ORDER MODAL (Zanjir) */}
      <Modal
        open={offerVisible}
        footer={null}
        closable={false}
        centered
        width={320}
        bodyStyle={{ textAlign: 'center', padding: 24 }}
      >
         <FireOutlined style={{ fontSize: 40, color: 'orange', marginBottom: 10 }} />
         <Title level={4}>Yangi buyurtma!</Title>
         <Text type="secondary">Sizga yaqin joyda buyurtma bor</Text>
         
         <div style={{ background: '#f5f5f5', padding: 10, borderRadius: 12, margin: '15px 0', textAlign: 'left' }}>
            <Text strong>{nextOrder?.pickup_location}</Text>
            <div style={{ color: 'green', fontWeight: 'bold' }}>{nextOrder?.price?.toLocaleString()} so'm</div>
         </div>

         <Progress type="circle" percent={(offerTimer / 15) * 100} width={60} format={() => `${offerTimer}s`} />
         
         <Row gutter={10} style={{ marginTop: 20 }}>
            <Col span={12}>
               <Button block size="large" onClick={closeChainOffer}>O'tkazish</Button>
            </Col>
            <Col span={12}>
               <Button type="primary" block size="large" onClick={acceptChainOrder}>Qabul qilish</Button>
            </Col>
         </Row>
      </Modal>

    </div>
  );
}