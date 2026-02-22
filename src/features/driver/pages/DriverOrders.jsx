import React, { useState, useEffect } from "react";
import { Card, List, Button, Tag, Typography, message, Empty, Skeleton } from "antd";
import { 
  CheckOutlined, EnvironmentOutlined, PhoneOutlined 
} from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { supabase } from "@/lib/supabase"; 

// --- MAP ICON FIX ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow,
    iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

async function trySelectOrdersByDriver(sb, userId) {
  // Support schema variants: orders.driver_user_id or orders.driver_id
  let q = sb.from('orders').select('*');
  // Prefer driver_user_id
  let res = await q.eq('driver_user_id', userId).order('created_at', { ascending: false });
  if (!res.error) return res;
  // Fallback to driver_id
  res = await sb.from('orders').select('*').eq('driver_id', userId).order('created_at', { ascending: false });
  return res;
}

async function tryAcceptOrder(sb, orderId, userId) {
  // Atomic-ish accept with schema variant support.
  // Prefer driver_user_id column.
  let res = await sb
    .from('orders')
    .update({ status: 'accepted', driver_user_id: userId, accepted_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'offered')
    .is('driver_user_id', null)
    .select('*')
    .maybeSingle();

  if (!res.error) return res;

  // Fallback to driver_id column
  res = await sb
    .from('orders')
    .update({ status: 'accepted', driver_id: userId, accepted_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'offered')
    .is('driver_id', null)
    .select('*')
    .maybeSingle();

  return res;
}

const { Text, Title } = Typography;

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], 15);
  }, [lat, lng]);
  return null;
}

export default function DriverOrderFeed() {
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dastur ochilganda
  useEffect(() => {
    checkActiveOrder();
    fetchOrders();

    // Realtime kuzatish
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        // 1. Yangi buyurtma tushsa (pending YOKI searching)
        if (payload.eventType === 'INSERT' && ['pending', 'searching'].includes(payload.new.status)) {
            setOrders(prev => [payload.new, ...prev]);
            message.info("Yangi buyurtma tushdi!");
        }
        // 2. Buyurtma o'zgarsa (birov olsa yoki bekor bo'lsa)
        if (payload.eventType === 'UPDATE' && !['pending', 'searching'].includes(payload.new.status)) {
            setOrders(prev => prev.filter(o => o.id !== payload.new.id));
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
        .eq('driver_user_id', user.id)
        .in('status', ['accepted', 'arrived', 'in_progress'])
        .limit(1);

      if (data && data.length > 0) {
          setActiveOrder(data[0]);
      }
  };

  const fetchOrders = async () => {
    setLoading(true);
    // ✅ TUZATILDI: Endi 'pending' VA 'searching' ikkalasini ham oladi
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'searching']) 
      .order('created_at', { ascending: false });

    if (error) console.error("Error fetching orders:", error);
    setOrders(data || []);
    setLoading(false);
  };

  // --- ACTIONS ---

  const acceptOrder = async (order) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          message.error("Iltimos, tizimga qayta kiring");
          return;
      }

      // Optimistik yangilanish (UI tezroq ishlashi uchun)
      const { data: accepted, error } = await tryAcceptOrder(supabase, order.id, user.id); // Faqat bo'shlarini olish

      if (error) throw error;
      
      // Tekshiramiz, rostan ham bizga o'tdimi
      const { data: check } = await supabase.from('orders').select('driver_id').eq('id', order.id).single();
      
      if (!check || check.driver_id !== user.id) {
          message.warning("Ulgurmadingiz, buyurtmani boshqa haydovchi oldi.");
          fetchOrders();
          return;
      }

      message.success("Buyurtma qabul qilindi!");
      setActiveOrder({ ...order, status: 'accepted', driver_id: user.id });
      setOrders(prev => prev.filter(o => o.id !== order.id)); // Ro'yxatdan o'chirish

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
              message.success("Safar yakunlandi!");
              setActiveOrder(null);
              fetchOrders();
          }
      }
  };

  // Koordinatalarni parsing qilish
  const parseLocation = (locString) => {
      if (!locString) return null;
      // Format: "Lat: 42.46..., Lng: 59.61..."
      const match = locString.match(/Lat:\s*([0-9.]+),\s*Lng:\s*([0-9.]+)/);
      if (match) return [parseFloat(match[1]), parseFloat(match[2])];
      return null; 
  };

  // --- AGAR AKTIV BUYURTMA BO'LSA -> XARITA REJIMI ---
  if (activeOrder) {
      // Agar location text bo'lsa (Lat: ..., Lng: ...) parse qilamiz, bo'lmasa default Nukus
      const clientPos = parseLocation(activeOrder.pickup_location) || [42.4619, 59.6166];
      const destPos = parseLocation(activeOrder.dropoff_location);

      return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer center={clientPos} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={clientPos}><Popup>Yo'lovchi</Popup></Marker>
                    {destPos && <Marker position={destPos}><Popup>Manzil</Popup></Marker>}
                    <RecenterMap lat={clientPos[0]} lng={clientPos[1]} />
                </MapContainer>
            </div>

            <div style={{ padding: 20, background: '#fff', boxShadow: '0 -5px 20px rgba(0,0,0,0.1)', borderRadius: '20px 20px 0 0', zIndex: 1000 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                    <div>
                        <Title level={5} style={{ margin: 0 }}>Mijoz kutyapti</Title>
                        <Text type="secondary">{activeOrder.pickup_location}</Text>
                    </div>
                    <Button shape="circle" size="large" icon={<PhoneOutlined />} type="primary" style={{ background: '#52c41a' }} />
                </div>

                {activeOrder.status === 'accepted' && (
                    <Button block type="primary" size="large" onClick={() => updateStatus('arrived')} style={{ height: 50, background: 'black' }}>
                        YETIB KELDIM
                    </Button>
                )}
                {activeOrder.status === 'arrived' && (
                    <Button block type="primary" size="large" onClick={() => updateStatus('in_progress')} style={{ height: 50, background: '#faad14', color: 'black' }}>
                        SAFARNI BOSHLASH
                    </Button>
                )}
                {activeOrder.status === 'in_progress' && (
                    <Button block type="primary" danger size="large" onClick={() => updateStatus('completed')} style={{ height: 50 }}>
                        YAKUNLASH
                    </Button>
                )}
            </div>
        </div>
      );
  }

  // --- BUYURTMALAR RO'YXATI ---
  return (
    <div style={{ padding: "15px", paddingBottom: "100px", minHeight: "100vh", background: "#f8f9fa" }}>
      <Title level={4} style={{ marginBottom: 20, paddingLeft: 5 }}>Buyurtmalar</Title>

      {loading ? (
         <Skeleton active avatar paragraph={{ rows: 2 }} />
      ) : orders.length === 0 ? (
        <Empty description="Hozircha buyurtmalar yo'q" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={orders}
          renderItem={item => (
            <Card key={item.id} style={{ marginBottom: 15, borderRadius: 16, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                {/* Agar service_type bo'lmasa 'Taksi' deb chiqaradi */}
                <Tag color="blue">{item.service_type === 'taxi' || !item.service_type ? 'Taksi' : item.service_type}</Tag>
                <Title level={4} style={{ margin: 0, color: "#52c41a" }}>{parseInt(item.price).toLocaleString()} so'm</Title>
              </div>

              <div style={{ marginBottom: 15 }}>
                 <div style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                     <EnvironmentOutlined style={{ color: "#52c41a", marginTop: 4 }} />
                     {/* Text uzun bo'lsa qirqib tashlash */}
                     <Text style={{width: '90%'}} ellipsis={{tooltip: item.pickup_location}}>
                        {item.pickup_location}
                     </Text>
                 </div>
                 {item.dropoff_location && (
                    <div style={{ display: "flex", gap: 8 }}>
                        <EnvironmentOutlined style={{ color: "#ff4d4f", marginTop: 4 }} />
                        <Text style={{width: '90%'}} ellipsis={{tooltip: item.dropoff_location}}>
                            {item.dropoff_location}
                        </Text>
                    </div>
                 )}
              </div>

              <Button 
                  type="primary" block size="large" icon={<CheckOutlined />} 
                  style={{ background: "black", borderRadius: 12, height: 45 }}
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