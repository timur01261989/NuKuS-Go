import React, { useState, useEffect, useRef } from "react";
import { Button, Card, List, Typography, Tag, message, Skeleton, Modal, Statistic, Row, Col, Avatar, Progress, Badge } from "antd";
import { 
  ArrowLeftOutlined, EnvironmentFilled, PhoneOutlined, 
  CarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CompassOutlined, SoundOutlined, FireOutlined, MessageOutlined,
  WalletOutlined, StarFilled, ThunderboltFilled
} from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../../pages/supabase";

import ChatComponent from '../ChatComponent';
const openExternalMap = (destination) => {
  const lat = destination[0];
  const lon = destination[1];

  // Deep link: Haqiqiy ilovani barcha koordinatalar bilan ochadi
  const yandexNaviUrl = `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`;

  // Ilovani ochishga urinish
  window.location.href = yandexNaviUrl;

  // Agar ilova ochilmasa (o'rnatilmagan bo'lsa) 2 soniyadan keyin do'konga yo'naltiradi
  setTimeout(() => {
    if (document.hasFocus()) {
       window.open(`https://play.google.com/store/apps/details?id=ru.yandex.yandexnavi`, '_blank');
    }
  }, 2000);
};

const { Title, Text } = Typography;

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
const clientIcon = L.divIcon({
  html: '<div style="font-size: 30px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🙋‍♂️</div>',
  className: 'custom-client-icon', iconSize: [30, 30], iconAnchor: [15, 30]
});

const carIcon = L.divIcon({
  html: `<div style="font-size: 35px; transition: all 1.2s linear; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">🚖</div>`,
  className: 'custom-car-icon', iconSize: [35, 35], iconAnchor: [17, 17]
});

const playVoiceNote = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uz-UZ';
    window.speechSynthesis.speak(utterance);
  }
};

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
}

function RoutingMachine({ from, to, color = '#1890ff' }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !from || !to) return;
    map.eachLayer(l => { if (l.options && l.options.name === 'route-line') map.removeLayer(l) });
    const control = L.Routing.control({
      waypoints: [L.latLng(from), L.latLng(to)],
      lineOptions: { styles: [{ color: color, weight: 6, opacity: 0.8, dashArray: color === '#52c41a' ? '10, 10' : '' }] },
      createMarker: () => null, addWaypoints: false, show: false,
      router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' })
    }).addTo(map);
    control.getPlan().options.name = 'route-line';
    return () => { try { map.removeControl(control) } catch(e){} };
  }, [map, from, to, color]);
  return null;
}

export default function DriverTaxi({ onBack }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState([42.4619, 59.6166]); 
  const [loading, setLoading] = useState(false);
  const [tripStep, setTripStep] = useState(0); 
  const [waitTime, setWaitTime] = useState(0);
  const waitTimerRef = useRef(null);

  const [chatVisible, setChatVisible] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [dailyEarnings, setDailyEarnings] = useState({ total: 0, count: 0 });
  const [activityPoints, setActivityPoints] = useState(100);

  // --- 2. DINAMIK NARX UCHUN STATELAR ---
  const [totalTraveledDist, setTotalTraveledDist] = useState(0);
  const lastPositionRef = useRef(null);

  const [nextOrder, setNextOrder] = useState(null);
  const [offerVisible, setOfferVisible] = useState(false);
  const [offerTimeLeft, setOfferTimeLeft] = useState(15);
  const offerTimerRef = useRef(null);

  const WAIT_FREE_LIMIT = 120; 
  const WAIT_PRICE_PER_MIN = 500; 

  useEffect(() => {
    const initDriver = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDriverId(user.id);
        fetchDailyStats(user.id);
        fetchActivityPoints(user.id);
      }
    };
    initDriver();
  }, []);

  const fetchDailyStats = async (uid) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('orders')
      .select('price')
      .eq('driver_id', uid)
      .eq('status', 'completed')
      .gte('created_at', today);

    if (data) {
      const total = data.reduce((sum, item) => sum + (item.price || 0), 0);
      setDailyEarnings({ total, count: data.length });
    }
  };

  const fetchActivityPoints = async (uid) => {
    const { data } = await supabase.from('drivers').select('activity_points').eq('id', uid).single();
    if (data) setActivityPoints(data.activity_points || 100);
  };

  // --- 3. FAОLLIK BALLARINI YANGILASH MANTIQI ---
  const updateActivity = async (points) => {
    const newPoints = activityPoints + points;
    setActivityPoints(newPoints);
    await supabase.from('drivers').update({ activity_points: newPoints }).eq('id', driverId);
    if (points < 0) message.warning(`Faollik balingiz tushdi: ${points}`);
  };

  useEffect(() => {
    if (navigator.geolocation) {
       const watchId = navigator.geolocation.watchPosition(
          async (pos) => {
            const newPos = [pos.coords.latitude, pos.coords.longitude];

            // --- 4. DINAMIK MASOFA HISOBI (Safar vaqtida) ---
            if (tripStep === 3) {
                if (lastPositionRef.current) {
                    const d = getDistance(lastPositionRef.current[0], lastPositionRef.current[1], newPos[0], newPos[1]);
                    if (d > 0.03) { // 30 metrdan ko'p yursa hisoblaydi
                        setTotalTraveledDist(prev => prev + d);
                    }
                }
                lastPositionRef.current = newPos;
            }

            setDriverLocation(newPos);
            if (driverId) {
              await supabase.from('drivers').update({ 
                current_lat: pos.coords.latitude, 
                current_lng: pos.coords.longitude,
                last_updated: new Date().toISOString()
              }).eq('id', driverId);
            }
          },
          (err) => console.error(err), { enableHighAccuracy: true }
       );
       return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [driverId, tripStep]);

  useEffect(() => {
     fetchOrders();
     const channel = supabase.channel('taxi-orders')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
       .subscribe();
     return () => supabase.removeChannel(channel);
  }, []);

  const fetchOrders = async () => {
      const { data } = await supabase.from('orders').select('*')
        .eq('service_type', 'taxi').eq('status', 'pending').order('created_at', { ascending: false });
      if (data) setActiveOrders(data);
  };

  const acceptOrder = async (order) => {
      await supabase.from('orders').update({ status: 'accepted', driver_id: driverId }).eq('id', order.id);
      setCurrentOrder(order);
      setTripStep(1); 
      playVoiceNote("Buyurtma qabul qilindi.");
  };

  const arrivedAtPickup = async () => {
      await supabase.from('orders').update({ status: 'arrived' }).eq('id', currentOrder.id);
      setTripStep(2); 
      setWaitTime(0);
      playVoiceNote("Mijoz kutilmoqda.");
      waitTimerRef.current = setInterval(() => setWaitTime(prev => prev + 1), 1000);
  };

  const startTrip = async () => {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
      await supabase.from('orders').update({ status: 'in_progress' }).eq('id', currentOrder.id);
      setTripStep(3); 
      setTotalTraveledDist(0);
      lastPositionRef.current = driverLocation;
      playVoiceNote("Safar boshlandi.");
  };

  const finishTrip = async () => {
      // Dinamik narx: Agar masofa bo'yicha narx dastlabki narxdan oshsa, yangisini oladi
      const distancePrice = Math.ceil((totalTraveledDist * 2000) / 500) * 500; // 1km = 2000 so'm
      const basePrice = currentOrder?.price || 0;
      const finalPrice = Math.max(basePrice, distancePrice) + waitCost;

      await supabase.from('orders').update({ status: 'completed', price: finalPrice }).eq('id', currentOrder.id);
      playVoiceNote("Safar yakunlandi.");
      updateActivity(2); // Safar yakunlangani uchun +2 ball
      fetchDailyStats(driverId);
      checkForChainOrder();
  };

  const cancelActiveOrder = async () => {
      if (currentOrder) {
          await supabase.from('orders').update({ status: 'pending', driver_id: null }).eq('id', currentOrder.id);
          updateActivity(-10); // Bekor qilish uchun -10 ball
          setTripStep(0);
          setCurrentOrder(null);
          message.error("Buyurtma bekor qilindi, faollik tushdi.");
      }
  };

  const checkForChainOrder = async () => {
      const { data } = await supabase.from('orders').select('*').eq('status', 'pending');
      if (data && data.length > 0) {
          let nearest = data.find(o => getDistance(driverLocation[0], driverLocation[1], parseLoc(o.pickup_location)[0], parseLoc(o.pickup_location)[1]) < 3);
          if (nearest) {
              setNextOrder(nearest);
              setOfferVisible(true);
              setOfferTimeLeft(15);
              return;
          }
      }
      setTripStep(4);
  };

  const handleAcceptNext = async () => {
      if (offerTimerRef.current) clearInterval(offerTimerRef.current);
      setOfferVisible(false);
      acceptOrder(nextOrder);
  };

  const parseLoc = (str) => {
      const parts = str?.match(/[\d.]+/g);
      return parts ? [parseFloat(parts[0]), parseFloat(parts[1])] : [0,0];
  };

  const openExternalMap = (destination) => {
      window.open(`yandexmaps://maps.yandex.com/?pt=${destination[1]},${destination[0]}&z=14&l=map`, '_blank');
  };

  const waitCost = Math.max(0, Math.ceil((waitTime - WAIT_FREE_LIMIT) / 60)) * WAIT_PRICE_PER_MIN;
  const currentPriceDisplay = Math.max((currentOrder?.price || 0), Math.ceil((totalTraveledDist * 2000) / 500) * 500) + waitCost;

  if (tripStep === 0) {
      return (
          <div style={{ padding: 15, background: '#f0f2f5', minHeight: '100vh' }}>
              <Card style={{ borderRadius: 20, marginBottom: 15, background: '#000', color: '#fff', border: 'none' }}>
                  <Row align="middle" justify="space-between">
                      <Col span={14}>
                          <Text style={{ color: '#aaa', fontSize: 12 }}>BUGUNGI DAROMAD</Text>
                          <Title level={3} style={{ color: '#FFD700', margin: 0 }}>{dailyEarnings.total.toLocaleString()} so'm</Title>
                      </Col>
                      <Col span={10} style={{ textAlign: 'right' }}>
                          <Tag color="orange" icon={<ThunderboltFilled />} style={{ borderRadius: 8 }}>{activityPoints} Faollik</Tag>
                          <div style={{ marginTop: 5, color: '#aaa', fontSize: 12 }}>{dailyEarnings.count} ta safar</div>
                      </Col>
                  </Row>
              </Card>

              <div style={{ display: "flex", alignItems: "center", marginBottom: 15 }}>
                  <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={onBack} />
                  <Title level={4} style={{ margin: "0 0 0 15px", fontFamily: 'YangoHeadline' }}>Buyurtmalar</Title>
              </div>

              <List dataSource={activeOrders} renderItem={item => (
                  <Card hoverable style={{ marginBottom: 12, borderRadius: 20, border: 'none' }} onClick={() => acceptOrder(item)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong style={{ fontSize: 16 }}>{item.pickup_location?.slice(0, 30)}...</Text>
                          <Tag color="green" style={{ borderRadius: 8 }}>{parseInt(item.price).toLocaleString()} so'm</Tag>
                      </div>
                      <Button type="primary" block style={{ marginTop: 15, background: '#000', borderRadius: 12, height: 45, fontWeight: 700 }}>QABUL QILISH</Button>
                  </Card>
              )} />
          </div>
      );
  }
    const carIcon = L.divIcon({
      html: `<div class="smooth-car-marker" style="font-size: 35px; transform-origin: center;">🚖</div>`,
      className: 'custom-car-icon', 
      iconSize: [35, 35], 
      iconAnchor: [17, 17]
    });

    const handleNavigation = (lat, lon) => {
      // Yandex Navigator ilovasi uchun maxsus Deep Link
      const uri = `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`;

      // Ilovani ochishga urinish
      window.location.href = uri;

      // Agar ilova o'rnatilmagan bo'lsa, brauzerda Yandex Maps ochiladi
      setTimeout(() => {
        if (document.hasFocus()) {
          window.open(`https://yandex.uz/maps/?rtext=~${lat},${lon}`, '_blank');
        }
      }, 1500);
    };

  const pickupCoords = parseLoc(currentOrder?.pickup_location);
  const dropoffCoords = parseLoc(currentOrder?.dropoff_location);

  return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative' }}>
              <MapContainer center={driverLocation} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer url={getMapStyle()} />
                  <Marker position={driverLocation} icon={carIcon} />
                  {tripStep === 1 && <Marker position={pickupCoords} icon={clientIcon} />}
                  {(tripStep === 1 || tripStep === 3) && <RoutingMachine from={driverLocation} to={tripStep === 1 ? pickupCoords : dropoffCoords} color={tripStep === 1 ? "#52c41a" : "#1890ff"} />}
              </MapContainer>

              {currentOrder && (
                <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000 }}>
                    <Button shape="circle" size="large" icon={<MessageOutlined />} onClick={() => setChatVisible(true)} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: 'none' }} />
                </div>
              )}

              {(tripStep === 1 || tripStep === 3) && (
                  <Button shape="round" icon={<CompassOutlined />} type="primary" style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000, background: '#000', border: 'none' }} onClick={() => openExternalMap(tripStep === 1 ? pickupCoords : dropoffCoords)}>NAVIGATOR</Button>
              )}
          </div>

          <div style={{ background: '#fff', padding: '20px 15px', borderRadius: '24px 24px 0 0', boxShadow: '0 -5px 25px rgba(0,0,0,0.1)', zIndex: 1001 }}>
              <div style={{ textAlign: 'center', marginBottom: 15 }}>
                  <Tag color={tripStep === 3 ? "green" : "orange"} style={{ borderRadius: 6, fontWeight: 'bold' }}>
                    {tripStep === 1 ? "MIJOZGA BORILMOQDA" : tripStep === 2 ? "KUTILMOQDA" : "YUKLANDI"}
                  </Tag>
              </div>

              {tripStep < 4 && (
                  <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar size={50} style={{ backgroundColor: '#FFD700' }} icon={<UserOutlined style={{color:'#000'}}/>} />
                          <div><Title level={5} style={{ margin: 0, fontFamily: 'YangoHeadline' }}>{currentOrder?.client_name || 'Yo\'lovchi'}</Title><Text type="secondary">5.0 ★</Text></div>
                      </div>
                      <Button shape="circle" size="large" icon={<PhoneOutlined />} style={{ background: '#f5f5f5', color: '#000', border: 'none' }} />
                  </div>

                  {/* SAFAR NARXI (Dinamik) */}
                  {tripStep === 3 && (
                      <div style={{ textAlign: 'center', marginBottom: 15, background: '#f9f9f9', padding: '10px', borderRadius: '12px' }}>
                          <Text type="secondary">Joriy hisob:</Text>
                          <Title level={3} style={{ margin: 0 }}>{currentPriceDisplay.toLocaleString()} so'm</Title>
                          <Text style={{ fontSize: 10 }}>Masofa: {totalTraveledDist.toFixed(1)} km</Text>
                      </div>
                  )}
                  </>
              )}

              {tripStep === 1 && (
                  <Row gutter={10}>
                      <Col span={16}><Button type="primary" block size="large" onClick={arrivedAtPickup} style={{ height: 60, borderRadius: 16, background: '#000', fontWeight: 800 }}>YETIB KELDIM</Button></Col>
                      <Col span={8}><Button block size="large" danger onClick={cancelActiveOrder} style={{ height: 60, borderRadius: 16 }}>BEKOR</Button></Col>
                  </Row>
              )}
              {tripStep === 2 && (
                  <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, background: '#f9f9f9', padding: 15, borderRadius: 12 }}>
                          <div><Text type="secondary">Kutish vaqti:</Text><div style={{ fontSize: 24, fontWeight: 'bold', color: paidWaitSeconds > 0 ? '#ff4d4f' : '#52c41a' }}>{Math.floor(waitTime / 60)}:{String(waitTime % 60).padStart(2, '0')}</div></div>
                          <div style={{ textAlign: 'right' }}><Text type="secondary">Kutish haqi:</Text><div style={{ fontSize: 20, fontWeight: 'bold' }}>{waitCost}</div></div>
                      </div>
                      <Button type="primary" block size="large" onClick={startTrip} style={{ height: 60, borderRadius: 16, background: '#52c41a', border: 'none', fontWeight: 800 }}>KETDIK!</Button>
                  </div>
              )}
              {tripStep === 3 && <Button type="primary" block size="large" danger onClick={finishTrip} style={{ height: 60, borderRadius: 16, fontWeight: 800 }}>SAFARNI YAKUNLASH</Button>}

              {tripStep === 4 && (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                      <CheckCircleOutlined style={{ fontSize: 50, color: '#52c41a', marginBottom: 10 }} />
                      <Title level={2} style={{ margin: 0 }}>{currentPriceDisplay.toLocaleString()} so'm</Title>
                      <Button block size="large" style={{ marginTop: 20, borderRadius: 16, height: 55, background: '#000', color: '#fff' }} onClick={() => { setTripStep(0); setCurrentOrder(null); }}>BOSH SAHIFA</Button>
                  </div>
              )}
          </div>

          <ChatComponent orderId={currentOrder?.id} userId={driverId} visible={chatVisible} onClose={() => setChatVisible(false)} />

          <Modal open={offerVisible} footer={null} closable={false} centered width={320} bodyStyle={{ textAlign: 'center', padding: 25, borderRadius: 20 }}>
              <Title level={4} style={{ color: '#faad14' }}><FireOutlined /> ZANJIR BUYURTMA!</Title>
              <Progress type="circle" percent={(offerTimeLeft / 15) * 100} format={() => `${offerTimeLeft}s`} strokeColor="#faad14" width={70} />
              <div style={{ textAlign: 'left', background: '#f9f9f9', padding: 15, borderRadius: 12, margin: '20px 0' }}>
                  <Text strong>{nextOrder?.pickup_location?.slice(0, 30)}...</Text>
                  <div style={{ marginTop: 5, color: 'green', fontWeight: 'bold' }}>{parseInt(nextOrder?.price).toLocaleString()} so'm</div>
              </div>
              <Row gutter={10}>
                  <Col span={12}><Button block size="large" onClick={() => setOfferVisible(false)}>Rad etish</Button></Col>
                  <Col span={12}><Button type="primary" block size="large" style={{ background: '#000' }} onClick={handleAcceptNext}>Qabul qilish</Button></Col>
              </Row>
          </Modal>

          <style>{`
            .leaflet-marker-icon { transition: transform 1.2s linear !important; }
            .ant-btn:active { transform: scale(0.96); }
          `}</style>
      </div>
  );
}