import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Button, Typography, Avatar, message, Badge, Result } from 'antd';
import {
  ArrowLeftOutlined,
  CarOutlined,
  PhoneOutlined,
  UserOutlined,
  MessageOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';

import { supabase } from "../../../lib/supabase";

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import ChatComponent from '../../chat/components/ChatComponent';
import RatingModal from '../../shared/components/RatingModal';

const { Text } = Typography;

/** ---------------- MAP STYLE ---------------- */
const getMapStyle = () => {
  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 6;
  return isNight
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
};

/** ---------------- ICONS ---------------- */
const carIcon = L.divIcon({
  html: '<div class="smooth-car-wrapper" style="font-size: 35px; transition: all 1.5s linear; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">🚖</div>',
  className: 'car-marker-container',
  iconSize: [35, 35],
  iconAnchor: [17, 17]
});
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

/** ---------------- TARIFFS ---------------- */
const TARIFFS = [
  { id: 'start', name: 'Start', basePrice: 4000, time: '3 min', icon: <CarOutlined /> },
  { id: 'comfort', name: 'Komfort', basePrice: 6000, time: '5 min', icon: <CarOutlined /> },
  { id: 'delivery', name: 'Yetkazish', basePrice: 10000, time: '10 min', icon: <EnvironmentOutlined /> },
];

/** ---------------- ROUTING ---------------- */
function RoutingMachine({ from, to, color = '#FFD400' }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !from || !to) return;

    const control = L.Routing.control({
      waypoints: [L.latLng(from), L.latLng(to)],
      lineOptions: { styles: [{ color, weight: 6, opacity: 0.85, dashArray: '5, 10' }] },
      createMarker: () => null,
      addWaypoints: false,
      show: false,
      fitSelectedRoutes: true,
      router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' })
    }).addTo(map);

    return () => { try { map.removeControl(control); } catch (e) {} };
  }, [map, from, to, color]);

  return null;
}

/** Map fly helper */
function MapFlyTo({ center, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (center && trigger) {
      map.flyTo(center, 16, { animate: true, duration: 1.2 });
    }
  }, [trigger, center, map]);
  return null;
}

/** Center picker */
function CenterPicker({ enabled, onCenterChanged }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;

    const emit = () => {
      const c = map.getCenter();
      onCenterChanged([c.lat, c.lng]);
    };

    map.on('move', emit);
    map.on('moveend', emit);
    emit();

    return () => {
      map.off('move', emit);
      map.off('moveend', emit);
    };
  }, [enabled, map, onCenterChanged]);

  return null;
}

/** Speech helper */
const speak = (text) => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'uz-UZ';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch (_) {}
};

/** Reverse geocode (address) */
const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  const json = await res.json();
  return json?.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
};

export default function ClientOrderCreate({ onBack }) {
  const [mode, setMode] = useState('main');

  const [userLoc, setUserLoc] = useState([42.4619, 59.6166]);
  const [destLoc, setDestLoc] = useState(null);

  const [selectingDest, setSelectingDest] = useState(false);
  const [centerPos, setCenterPos] = useState(null);
  const [centerAddress, setCenterAddress] = useState("Manzil aniqlanmoqda...");

  const [driverLoc, setDriverLoc] = useState(null);
  const [realDriver, setRealDriver] = useState(null);

  const [pinAddress, setPinAddress] = useState("Manzilni tanlang");
  const [currentOrderId, setCurrentOrderId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [flyTrigger, setFlyTrigger] = useState(0);

  const [selectedTariff, setSelectedTariff] = useState(TARIFFS[0]);

  const [chatVisible, setChatVisible] = useState(false);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [userId, setUserId] = useState(null);

  const handleBack = useCallback(() => {
    if (typeof onBack === 'function') onBack();
    else window.history.back();
  }, [onBack]);

  /** initial */
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!cancelled) setUserId(data.user?.id || null);

      const resume = async () => { await checkActiveOrder(); };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (p) => {
          const pos = [p.coords.latitude, p.coords.longitude];
          if (cancelled) return;
          setUserLoc(pos);
          setFlyTrigger(prev => prev + 1);
          await resume();
        }, async () => {
          await resume();
        });
      } else {
        await resume();
      }
    };

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Resume active order */
  const checkActiveOrder = async () => {
    const savedOrderId = localStorage.getItem('activeOrderId');
    if (!savedOrderId) return;

    const { data, error } = await supabase
      .from('orders')
      .select('id, status, price, driver_id, client_id, dropoff_location, pickup_location, from_lat, from_lng, to_lat, to_lng, service_type')
      .eq('id', savedOrderId)
      .single();

    if (error || !data) {
      localStorage.removeItem('activeOrderId');
      return;
    }

    if (['completed', 'cancelled'].includes(data.status)) {
      localStorage.removeItem('activeOrderId');
      return;
    }

    setCurrentOrderId(data.id);

    if (data.pickup_location && !userLoc) {
      // no-op
    }

    if (data.dropoff_location) setPinAddress(data.dropoff_location);

    if (data.to_lat && data.to_lng) setDestLoc([Number(data.to_lat), Number(data.to_lng)]);

    if (data.service_type) {
      const t = TARIFFS.find(x => x.id === data.service_type);
      if (t) setSelectedTariff(t);
    }

    handleStatusChange(data.status, data);
  };

  /** Subscribe order status updates */
  useEffect(() => {
    if (!currentOrderId) return;

    const channel = supabase.channel(`client-order-${currentOrderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${currentOrderId}` },
        (payload) => { if (payload?.new) handleStatusChange(payload.new.status, payload.new); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrderId]);

  /** Subscribe driver gps updates */
  useEffect(() => {
    if (!realDriver?.id) return;

    const driverChannel = supabase.channel(`driver-gps-${realDriver.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drivers', filter: `id=eq.${realDriver.id}` },
        (payload) => {
          const row = payload?.new;
          if (!row) return;
          const lat = row.current_lat ?? row.lat;
          const lng = row.current_lng ?? row.lng;
          if (lat && lng) setDriverLoc([Number(lat), Number(lng)]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(driverChannel); };
  }, [realDriver]);

  /** Status mapper */
  const handleStatusChange = (status, data) => {
    if (status === 'pending' || status === 'searching') {
      setMode('searching');
      return;
    }
    if (status === 'accepted') {
      setMode('coming');
      if (data.driver_id) fetchDriverInfo(data.driver_id);
      speak("Buyurtma qabul qilindi.");
      return;
    }
    if (status === 'arrived') {
      setMode('arrived');
      speak("Haydovchi yetib keldi.");
      return;
    }
    if (status === 'in_progress') {
      setMode('in_progress');
      speak("Safar boshlandi.");
      return;
    }
    if (status === 'completed') {
      setMode('completed');
      setFinalPrice(data.price || 0);
      setRatingVisible(true);
      localStorage.removeItem('activeOrderId');
      return;
    }
    if (status === 'cancelled') {
      message.info("Buyurtma bekor qilindi");
      localStorage.removeItem('activeOrderId');
      setMode('main');
      setCurrentOrderId(null);
      setRealDriver(null);
      setDriverLoc(null);
      return;
    }
  };

  /** Wait timer */
  useEffect(() => {
    let interval;
    if (mode === 'arrived') interval = setInterval(() => setWaitTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [mode]);

  /** Fetch driver */
  const fetchDriverInfo = async (driverId) => {
    const { data } = await supabase.from('drivers').select('*').eq('id', driverId).single();
    if (data) {
      setRealDriver(data);
      const lat = data.current_lat ?? data.lat;
      const lng = data.current_lng ?? data.lng;
      if (lat && lng) setDriverLoc([Number(lat), Number(lng)]);
    }
  };

  /** When selectingDest, update address by centerPos (debounced) */
  useEffect(() => {
    if (!selectingDest || !centerPos) return;

    const t = setTimeout(async () => {
      try {
        const addr = await reverseGeocode(centerPos[0], centerPos[1]);
        setCenterAddress(addr);
      } catch (e) {
        setCenterAddress(`Lat: ${centerPos[0].toFixed(5)}, Lng: ${centerPos[1].toFixed(5)}`);
      }
    }, 450);

    return () => clearTimeout(t);
  }, [selectingDest, centerPos]);

  /** Start order (SCHEMA MOS) */
  const startOrder = async () => {
    if (loading) return;
    if (mode !== 'main') return;

    if (currentOrderId) {
      message.info("Sizda aktiv buyurtma bor. Avval uni yakunlang yoki bekor qiling.");
      return;
    }
    if (!destLoc) {
      message.info("Avval borish manzilini tanlang");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        message.error("Login qiling");
        return;
      }

      const pickupText = `Lat: ${userLoc[0].toFixed(5)}, Lng: ${userLoc[1].toFixed(5)}`;
      const dropText = pinAddress || centerAddress || `Lat: ${destLoc[0].toFixed(5)}, Lng: ${destLoc[1].toFixed(5)}`;

      const insertPayload = {
        // sizning orders schema:
        client_id: user.id,
        status: 'searching', // driver tomoni qabul qilganda accepted qiladi
        price: selectedTariff.basePrice,
        service_type: selectedTariff.id,

        pickup_location: pickupText,
        dropoff_location: dropText,

        from_lat: Number(userLoc[0]),
        from_lng: Number(userLoc[1]),
        to_lat: Number(destLoc[0]),
        to_lng: Number(destLoc[1]),

        // optional: agar keyin addresslarga bo‘lib ishlatsangiz
        from_address: pickupText,
        to_address: dropText,
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;

      setCurrentOrderId(data.id);
      localStorage.setItem('activeOrderId', data.id);
      setMode('searching');

    } catch (e) {
      message.error(e?.message || "Buyurtma berishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  /** Cancel order */
  const cancelOrder = async () => {
    try {
      if (currentOrderId) {
        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', currentOrderId);
      }
    } catch (_) {}
    localStorage.removeItem('activeOrderId');
    setMode('main');
    setCurrentOrderId(null);
    setRealDriver(null);
    setDriverLoc(null);
  };

  const ctaText = useMemo(() => {
    return loading
      ? "Yuklanmoqda..."
      : `Buyurtma berish • ${selectedTariff?.basePrice || 0} so'm`;
  }, [loading, selectedTariff]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* MAP */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={userLoc} zoom={16} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url={getMapStyle()} attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
          <MapFlyTo center={userLoc} trigger={flyTrigger} />

          <CenterPicker enabled={selectingDest} onCenterChanged={(pos) => setCenterPos(pos)} />

          <Marker
            position={userLoc}
            icon={L.divIcon({
              className: 'user-pulse-marker',
              html: `<div style="width: 18px; height: 18px; background: #1890ff; border-radius: 50%; border: 3px solid white;"></div>`
            })}
          />

          {mode === 'main' && destLoc && (
            <RoutingMachine from={userLoc} to={destLoc} color="#FFD400" />
          )}

          {['coming', 'arrived', 'in_progress'].includes(mode) && (
            <Marker
              position={driverLoc || [userLoc[0] + 0.003, userLoc[1] + 0.003]}
              icon={carIcon}
            />
          )}
        </MapContainer>

        {selectingDest && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -100%)',
              zIndex: 1200,
              pointerEvents: 'none',
              fontSize: 44,
              filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))'
            }}
          >
            📍
          </div>
        )}

        {['coming', 'arrived', 'in_progress'].includes(mode) && (
          <Badge dot={false} style={{ position: 'absolute', bottom: 320, right: 20, zIndex: 1000 }}>
            <Button
              shape="circle"
              size="large"
              icon={<MessageOutlined />}
              onClick={() => setChatVisible(true)}
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: 'none' }}
            />
          </Badge>
        )}

        <Button
          icon={<ArrowLeftOutlined />}
          shape="circle"
          size="large"
          onClick={handleBack}
          style={{ position: 'absolute', top: 15, left: 15, zIndex: 999 }}
        />
      </div>

      {/* MAIN SHEET */}
      {mode === 'main' && (
        <div className="yandex-sheet">
          <div className="sheet-handle" />
          <div className="sheet-content">
            <div className="where-row" onClick={() => setSelectingDest(true)}>
              <div className="where-icon">📍</div>
              <div className="where-text">
                <div className="where-title">{destLoc ? "Borish manzili" : "Qayerga boramiz?"}</div>
                <div className="where-sub">
                  {selectingDest
                    ? centerAddress
                    : (destLoc ? pinAddress : "Manzilni yozing yoki xaritadan tanlang")}
                </div>
              </div>
              <div className="where-action">{selectingDest ? "Tanlash" : ">"}</div>
            </div>

            <div className="from-row">
              <div className="from-dot" />
              <div className="from-text">
                <div className="from-title">Qayerdan</div>
                <div className="from-sub">{`Lat: ${userLoc[0].toFixed(5)}, Lng: ${userLoc[1].toFixed(5)}`}</div>
              </div>
            </div>

            {selectingDest && (
              <>
                <button
                  className="cta-btn"
                  onClick={() => {
                    if (!centerPos) return;
                    setDestLoc(centerPos);
                    setPinAddress(centerAddress);
                    setSelectingDest(false);
                  }}
                >
                  Manzilni tanlash
                </button>

                <div className="pick-hint">
                  Xarita siljiting — pin qaysi joyda tursa, o‘sha joy tanlanadi
                </div>
              </>
            )}

            {!selectingDest && (
              <>
                <div className="tariffs">
                  {TARIFFS.map(t => {
                    const active = selectedTariff?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        className={"tariff-card" + (active ? " active" : "")}
                        onClick={() => setSelectedTariff(t)}
                      >
                        <div className="tariff-name">{t.name}</div>
                        <div className="tariff-sub">{t.time}</div>
                        <div className="tariff-price">{t.basePrice} so'm</div>
                      </div>
                    );
                  })}
                </div>

                <button
                  className={"cta-btn" + (!destLoc ? " disabled" : "")}
                  onClick={startOrder}
                  disabled={!destLoc || loading}
                >
                  {ctaText}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* SEARCHING / COMING / ARRIVED / IN_PROGRESS */}
      {mode !== 'main' && mode !== 'completed' && (
        <Card style={{ borderRadius: '24px 24px 0 0', border: 'none', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}>
          {mode === 'searching' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Mashina qidirilmoqda...</div>
              <div style={{ color: 'rgba(0,0,0,0.55)' }}>
                Tarif: <b>{selectedTariff?.name}</b> • {selectedTariff?.basePrice} so'm
              </div>
              <Button danger onClick={cancelOrder} style={{ borderRadius: 14, height: 44, fontWeight: 800 }}>
                Bekor qilish
              </Button>
            </div>
          )}

          {['coming', 'arrived', 'in_progress'].includes(mode) && (
            <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
              <Avatar size={60} src={realDriver?.avatar_url} icon={<UserOutlined />} style={{ border: '3px solid #FFD700' }} />
              <div>
                <div style={{ fontWeight: '900' }}>
                  {realDriver?.first_name || 'Haydovchi'} {realDriver?.last_name || ''}
                </div>
                <Text type="secondary">
                  {realDriver?.car_model || realDriver?.car_year || 'Avto'} • {realDriver?.plate_number || realDriver?.car_number || ''}
                </Text>
                {mode === 'arrived' && (
                  <div style={{ marginTop: 6, fontWeight: 800 }}>
                    Kutish: {waitTime}s
                  </div>
                )}
              </div>
              <Button
                icon={<PhoneOutlined />}
                shape="circle"
                style={{ marginLeft: 'auto' }}
                onClick={() => {
                  const phone = realDriver?.phone;
                  if (phone) window.open(`tel:${phone}`);
                }}
              />
            </div>
          )}
        </Card>
      )}

      {/* COMPLETED */}
      {mode === 'completed' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Result
            status="success"
            title="Safar yakunlandi!"
            subTitle={`To'lov: ${finalPrice.toLocaleString()} so'm`}
            extra={[
              <Button
                type="primary"
                key="close"
                onClick={() => {
                  setMode('main');
                  setCurrentOrderId(null);
                  setRealDriver(null);
                  setDriverLoc(null);
                  setDestLoc(null);
                  setSelectingDest(false);
                  localStorage.removeItem('activeOrderId');
                }}
              >
                Yopish
              </Button>
            ]}
          />
        </div>
      )}

      {/* Chat */}
      <ChatComponent
        orderId={currentOrderId}
        userId={userId}
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
      />

      {/* Rating */}
      <RatingModal
        visible={ratingVisible}
        order={{ id: currentOrderId, client_id: userId, driver_id: realDriver?.id }}
        onFinish={() => {
          setRatingVisible(false);
          setMode('main');
        }}
      />

      {/* CSS */}
      <style>{`
        .leaflet-marker-icon { transition: transform 1.5s linear !important; }
        .user-pulse-marker { animation: pulse 2s infinite; }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(24,144,255,0.4); }
          70% { box-shadow: 0 0 0 20px rgba(24,144,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(24,144,255,0); }
        }
      `}</style>

      <style>{`
        .yandex-sheet{
          position: relative;
          background: #fff;
          border-radius: 22px 22px 0 0;
          box-shadow: 0 -12px 30px rgba(0,0,0,0.12);
          padding: 10px 14px 14px;
        }
        .sheet-handle{
          width: 42px; height: 5px; border-radius: 999px;
          background: rgba(0,0,0,0.18);
          margin: 0 auto 10px;
        }
        .sheet-content{ display:flex; flex-direction:column; gap:10px; }
        .where-row{
          display:flex; gap:10px; align-items:center;
          background:#f5f5f5; border-radius:16px; padding:12px 12px;
          cursor:pointer;
        }
        .where-icon{ font-size:18px; }
        .where-text{ flex:1; min-width:0; }
        .where-title{ font-weight:800; }
        .where-sub{
          color:rgba(0,0,0,0.55); font-size:12px;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .where-action{ color:rgba(0,0,0,0.45); font-weight:700; }
        .from-row{
          display:flex; gap:10px; align-items:center;
          padding:6px 4px 2px;
        }
        .from-dot{
          width:10px; height:10px; border-radius:999px;
          background:#1890ff;
          box-shadow: 0 0 0 4px rgba(24,144,255,0.15);
        }
        .from-title{ font-weight:800; font-size:12px; }
        .from-sub{ color:rgba(0,0,0,0.55); font-size:12px; }
        .tariffs{
          display:flex; gap:10px; overflow:auto; padding:6px 2px 2px;
        }
        .tariff-card{
          min-width: 130px;
          background:#fff;
          border:1px solid rgba(0,0,0,0.08);
          border-radius:16px;
          padding:10px 12px;
          cursor:pointer;
          box-shadow: 0 6px 14px rgba(0,0,0,0.06);
        }
        .tariff-card.active{
          border-color:#FFD400;
          box-shadow: 0 8px 18px rgba(255,212,0,0.25);
        }
        .tariff-name{ font-weight:900; }
        .tariff-sub{ font-size:12px; color:rgba(0,0,0,0.55); margin-top:2px; }
        .tariff-price{ font-weight:900; margin-top:8px; }
        .cta-btn{
          height:56px;
          border:none;
          border-radius:18px;
          background:#FFD400;
          color:#000;
          font-weight:900;
          font-size:16px;
          cursor:pointer;
        }
        .cta-btn.disabled{
          opacity:0.55;
          cursor:not-allowed;
        }
        .pick-hint{
          background: rgba(0,0,0,0.75);
          color:#fff;
          padding:10px 12px;
          border-radius:14px;
          text-align:center;
          font-weight:700;
        }
      `}</style>
    </div>
  );
}
