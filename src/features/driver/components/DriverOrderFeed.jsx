import React, { useState, useEffect, useRef } from "react";
import { Card, List, Button, Tag, Typography, message, Empty, Spin, Skeleton } from "antd";
import { 
  CheckOutlined, ClockCircleOutlined, CarOutlined, 
  EnvironmentOutlined, SendOutlined, PhoneOutlined 
} from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { translations } from '@i18n/translations'; // Yo'l to'g'riligini tekshiring
import { supabase } from "../../../lib/supabase";

// --- MAP ICON FIX ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow,
    iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Maxsus mashina ikonchasi
const carIcon = L.divIcon({
  html: '<div style="font-size: 24px;">🚖</div>',
  className: 'car-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const { Text, Title } = Typography;

// Xaritani markazlashtirish komponenti
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], 15);
  }, [lat, lng]);
  return null;
}

// Marker harakati uchun komponent
function SmoothDriverMarker({ position }) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      const element = markerRef.current.getElement();
      if (element) element.style.transition = "transform 2s linear";
    }
  }, [position]);

  return (
    <Marker 
      ref={markerRef} 
      position={position} 
      icon={carIcon} 
    />
  );
}

export default function DriverOrderFeed() {
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null); 
  const [loading, setLoading] = useState(true); 

  // Haydovchi joylashuvi (Simulyatsiya)
  const [driverLoc, setDriverLoc] = useState([42.4619, 59.6166]);

  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  // Dastur ochilganda
  useEffect(() => {
    checkActiveOrder();
    fetchOrders();

    // Realtime buyurtmalar kuzatuvi
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        
        // 1. Yangi buyurtma tushsa (INSERT)
        if (payload.eventType === 'INSERT') {
           const isNew = ['pending', 'searching'].includes(payload.new.status);
           // Agar service_type bo'lmasa yoki taxi bo'lsa
           const isTaxi = !payload.new.service_type || payload.new.service_type === 'taxi';
           
           if (isNew && isTaxi) {
              setOrders(prev => [payload.new, ...prev]);
              message.info("Yangi buyurtma!");
           }
        }

        // 2. Buyurtma o'zgarsa (UPDATE) - masalan birov olsa
        if (payload.eventType === 'UPDATE') {
           const isTaken = !['pending', 'searching'].includes(payload.new.status);
           if (isTaken) {
              setOrders(prev => prev.filter(o => o.id !== payload.new.id));
           }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Aktiv buyurtmani tekshirish
  const checkActiveOrder = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', user.id) // Faqat o'zimnikini tekshirish
        .in('status', ['accepted', 'arrived', 'in_progress'])
        .limit(1);

      if (data && data.length > 0) {
          setActiveOrder(data[0]);
      }
  };

  const fetchOrders = async () => {
    setLoading(true);
    // 1. Faqat 'pending' va 'searching' buyurtmalarni olamiz
    // 2. Faqat 'taxi' turidagi buyurtmalarni olamiz (yoki type null bo'lsa)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'searching']) 
      .or('service_type.eq.taxi,service_type.is.null') // Type 'taxi' yoki bo'sh bo'lsa
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Fetch xato:", error);
    }
    
    setOrders(data || []);
    setTimeout(() => setLoading(false), 500);
  };

  // --- ACTIONS ---

  const acceptOrder = async (order) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          message.error("Tizimga kiring!");
          return;
      }

      // Optimistik tekshiruv va yangilash
      const { error } = await supabase
        .from('orders')
        .update({ 
            status: 'accepted', 
            driver_id: user.id, // <--- MUHIM: O'z IDingizni yozish
            driver_phone: '+998901234567' // Buni keyinchalik user profilidan olish kerak
        })
        .eq('id', order.id)
        .in('status', ['pending', 'searching']); // Faqat bo'sh bo'lsa o'zgartirish

      if (error) throw error;

      // Qayta tekshiramiz, rostan bizga o'tdimi
      const { data: check } = await supabase.from('orders').select('driver_id').eq('id', order.id).single();
      
      if (check && check.driver_id === user.id) {
          message.success("Buyurtma qabul qilindi! Mijozga boramiz.");
          setActiveOrder({ ...order, status: 'accepted', driver_id: user.id });
          setOrders(prev => prev.filter(o => o.id !== order.id));
      } else {
          message.warning("Kechirasiz, bu buyurtmani boshqa haydovchi oldi.");
          fetchOrders();
      }

    } catch (error) {
      console.error(error);
      message.error("Xatolik: " + error.message);
    }
  };

  const updateStatus = async (newStatus) => {
      if (!activeOrder) return;

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', activeOrder.id);

      if (!error) {
          setActiveOrder({ ...activeOrder, status: newStatus });
          if (newStatus === 'arrived') message.success("Mijozga xabar yuborildi: Yetib keldingiz!");
          if (newStatus === 'in_progress') message.success("Safar boshlandi!");
          if (newStatus === 'completed') {
              message.success("Safar yakunlandi! Hisobingiz to'ldirildi.");
              setActiveOrder(null); // Aktiv rejimdan chiqish
              fetchOrders(); // Ro'yxatni yangilash
          }
      }
  };

  // Koordinatalarni parsing qilish
  const parseLocation = (locString) => {
      if (!locString) return null;
      const match = locString.match(/Lat:\s*([0-9.]+),\s*Lng:\s*([0-9.]+)/);
      if (match) return [parseFloat(match[1]), parseFloat(match[2])];
      // Agar format boshqacha bo'lsa (masalan shunchaki manzil nomi) null qaytadi
      return null; 
  };

  const btnTouchProps = {
    onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.96)",
    onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
    onTouchStart: (e) => e.currentTarget.style.transform = "scale(0.96)",
    onTouchEnd: (e) => e.currentTarget.style.transform = "scale(1)",
    style: { transition: "transform 0.1s" }
  };

  // --- AGAR AKTIV BUYURTMA BO'LSA -> XARITA REJIMI ---
  if (activeOrder) {
      const clientPos = parseLocation(activeOrder.pickup_location) || [42.4619, 59.6166];
      const destPos = parseLocation(activeOrder.dropoff_location);

      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* XARITA */}
            <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer center={clientPos} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

                    {/* Yo'lovchi joyi */}
                    <Marker position={clientPos}>
                        <Popup>Yo'lovchi shu yerda</Popup>
                    </Marker>

                    {/* Haydovchi (Siz) */}
                    <SmoothDriverMarker position={driverLoc} />

                    {/* Borish manzili (agar bo'lsa) */}
                    {destPos && <Marker position={destPos}><Popup>Borish manzili</Popup></Marker>}

                    <RecenterMap lat={clientPos[0]} lng={clientPos[1]} />
                </MapContainer>
            </div>

            {/* PASTKI BOSHQARUV PANELI */}
            <div style={{ padding: 25, background: '#fff', boxShadow: '0 -10px 40px rgba(0,0,0,0.15)', borderRadius: '30px 30px 0 0', position: 'relative', zIndex: 1000 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                    <div style={{ maxWidth: '80%' }}>
                        <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Mijoz kutyapti</Title>
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
                           <EnvironmentOutlined style={{ color: '#52c41a', marginRight: 5, flexShrink: 0 }} />
                           <Text type="secondary" style={{ fontSize: 13 }} ellipsis={{tooltip: activeOrder.pickup_location}}>
                               {activeOrder.pickup_location}
                           </Text>
                        </div>
                    </div>
                    <Button 
                        shape="circle" size="large" icon={<PhoneOutlined />} type="primary" 
                        style={{ background: '#52c41a', border: 'none', width: 50, height: 50, boxShadow: '0 4px 10px rgba(82, 196, 26, 0.4)' }} 
                    />
                </div>

                {/* STATUSGA QARAB TUGMALAR */}
                {activeOrder.status === 'accepted' && (
                    <Button 
                        block type="primary" size="large" 
                        {...btnTouchProps}
                        style={{ height: 60, fontSize: 18, borderRadius: 20, fontWeight: 700, background: 'black', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', ...btnTouchProps.style }}
                        onClick={() => updateStatus('arrived')}
                    >
                        YETIB KELDIM 🏁
                    </Button>
                )}

                {activeOrder.status === 'arrived' && (
                    <div style={{ textAlign: 'center' }}>
                        <Text type="warning" strong style={{ display: 'block', marginBottom: 10 }}>Mijoz chiqishini kuting...</Text>
                        <Button 
                            block type="primary" size="large" 
                            {...btnTouchProps}
                            style={{ height: 60, fontSize: 18, borderRadius: 20, background: '#faad14', fontWeight: 700, border: 'none', color: 'black', ...btnTouchProps.style }}
                            onClick={() => updateStatus('in_progress')}
                        >
                            KETDIK (SAFARNI BOSHLASH) 🚖
                        </Button>
                    </div>
                )}

                {activeOrder.status === 'in_progress' && (
                    <Button 
                        block type="primary" danger size="large" 
                        {...btnTouchProps}
                        style={{ height: 60, fontSize: 18, borderRadius: 20, fontWeight: 700, boxShadow: '0 8px 20px rgba(255, 77, 79, 0.3)', ...btnTouchProps.style }}
                        onClick={() => updateStatus('completed')}
                    >
                        SAFARNI YAKUNLASH ✅
                    </Button>
                )}
            </div>
        </div>
      );
  }

  // --- AGAR BUYURTMA BO'LMASA -> RO'YXAT REJIMI ---
  return (
    <div style={{ padding: "15px", paddingBottom: "100px", minHeight: "100vh", background: "#f8f9fa" }}>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 800, paddingLeft: 5 }}>{t?.nearOrders || "Buyurtmalar"}</Title>

      {/* SKELETON LOADING (Yuklanayotganda) */}
      {loading ? (
         [1, 2, 3].map(i => (
            <Card key={i} style={{ marginBottom: 15, borderRadius: 24, border: "none" }}>
               <Skeleton active avatar paragraph={{ rows: 2 }} />
            </Card>
         ))
      ) : (
        <List
          dataSource={orders}
          locale={{ emptyText: <Empty description="Hozircha buyurtmalar yo'q" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          renderItem={item => (
            <Card key={item.id} hoverable style={{ marginBottom: 15, borderRadius: 24, border: "none", boxShadow: "0 8px 20px rgba(0,0,0,0.04)", overflow: 'hidden' }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' }}>
                <Tag icon={<CarOutlined />} color="blue" style={{ borderRadius: 12, padding: '2px 10px' }}>
                    {(item.service_type === 'taxi' || !item.service_type) ? 'TAKSI' : item.service_type.toUpperCase()}
                </Tag>
                <Title level={4} style={{ margin: 0, color: "#52c41a", fontWeight: 800 }}>{parseInt(item.price).toLocaleString()} so'm</Title>
              </div>

              <div style={{ marginBottom: 20, paddingLeft: 5 }}>
                 <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                     <div style={{ minWidth: 20, textAlign: 'center' }}><EnvironmentOutlined style={{ color: "#52c41a", fontSize: 18 }} /></div>
                     <Text strong style={{ fontSize: 15, lineHeight: 1.3 }}>{item.pickup_location}</Text>
                 </div>
                 <div style={{ borderLeft: "2px dashed #e0e0e0", height: 15, marginLeft: 9, margin: "0 0 5px 0" }}></div>
                 <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                     <div style={{ minWidth: 20, textAlign: 'center' }}><EnvironmentOutlined style={{ color: "#ff4d4f", fontSize: 18 }} /></div>
                     <Text strong style={{ fontSize: 15, lineHeight: 1.3 }}>
                         {item.dropoff_location && item.dropoff_location.includes("Lat:") ? "Xaritada belgilangan joy" : (item.dropoff_location || "Noma'lum")}
                     </Text>
                 </div>
              </div>

              <Button 
                  type="primary" block size="large" icon={<CheckOutlined />} 
                  {...btnTouchProps}
                  style={{ background: "black", height: 55, borderRadius: 18, fontWeight: 700, fontSize: 16, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', ...btnTouchProps.style }}
                  onClick={() => acceptOrder(item)}
              >
                  QABUL QILISH
              </Button>
            </Card>
          )}
        />
      )}
    </div>
  );
}