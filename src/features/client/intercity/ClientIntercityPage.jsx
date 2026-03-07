import React, { useMemo, useState, useCallback, useEffect } from "react";
import { 
  Button, 
  DatePicker, 
  Drawer, 
  Empty, 
  Spin, 
  message, 
  Switch, 
  Select, 
  InputNumber, 
  Checkbox, 
  Radio, 
  Tag, 
  Segmented,
  Modal,
  Typography
} from "antd";
import { 
  EnvironmentOutlined, 
  CarOutlined, 
  WomanOutlined, 
  InboxOutlined, 
  ThunderboltOutlined,
  CheckCircleFilled 
} from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom"; 
import { useLanguage } from "@/shared/i18n/useLanguage";
import { useClientText } from "../shared/i18n_clientLocalize";

import RegionDistrictSelect from "@/shared/components/RegionDistrictSelect";
import { UZ_REGIONS } from "@/shared/constants/uzRegions";
import { supabase } from "@/lib/supabase";
import { osrmRouteDriving, haversineKm } from "@/shared/services/osrm"; 

import AutoMarketAdsPanel from "../taxi/components/AutoMarketAdsPanel"; 
import { listMarketCars } from "../../../services/marketService.js";

import "leaflet/dist/leaflet.css";

// Marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const mapTile = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

// --- Yordamchi funksiyalar ---

function getRegionCenter(regionName) {
  const r = UZ_REGIONS.find((x) => x.name === regionName);
  return r?.center || null;
}

function loadSavedPickupPoints() {
  try {
    return JSON.parse(localStorage.getItem("saved_pickup_points") || "[]");
  } catch { return []; }
}

function savePickupPoint(pt) {
  if (!pt) return;
  const pts = loadSavedPickupPoints();
  const newPts = [pt, ...pts].filter((v, i, a) => a.findIndex(t => (t[0] === v[0] && t[1] === v[1])) === i).slice(0, 5);
  localStorage.setItem("saved_pickup_points", JSON.stringify(newPts));
}

// Manzil nomini aniqlash (Reverse Geocoding)
async function getAddressName(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz`);
    const data = await res.json();
    return data.display_name || cp("Noma'lum manzil");
  } catch (e) {
    return cp("Manzilni aniqlab bo'lmadi");
  }
}

// --- Komponentlar ---

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const validPoints = (points || []).filter(p => Array.isArray(p) && p.length === 2);
    if (validPoints.length === 0) return;
    if (validPoints.length === 1) {
      map.setView(validPoints[0], 9, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(validPoints.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds.pad(0.2), { animate: true });
  }, [map, points]);
  return null;
}

function PickupPicker({ value, onChange, savedPoints }) {
  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <>
      {Array.isArray(savedPoints) ? savedPoints.map((p, idx) => (
        <Marker key={`sp-${idx}`} position={p} eventHandlers={{ click: () => onChange(p) }} opacity={0.6} />
      )) : null}
      {value ? <Marker position={value} /> : null}
    </>
  );
}

// --- O'rindiq Tanlash Komponenti ---
function SeatSelector({ trip, selectedSeats, onToggleSeat }) {
  const { t, cp } = useClientText();
  const isCar = trip.vehicle_type === 'car' || !trip.vehicle_type; // Default yengil
  const totalSeats = trip.seats || 4;

  const seatStyle = (id) => ({
    width: 40, height: 40, 
    borderRadius: 8, 
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "bold", cursor: "pointer",
    border: "1px solid #ccc",
    background: selectedSeats.includes(id) ? "#1890ff" : "#fff",
    color: selectedSeats.includes(id) ? "#fff" : "#333",
    fontSize: 14
  });

  const driverSeatStyle = {
    width: 40, height: 40, borderRadius: 8, 
    background: "#ddd", color: "#666", 
    display: "flex", alignItems: "center", justifyContent: "center", 
    fontSize: 10, fontWeight: "bold", border: "1px solid #999"
  };

  if (isCar) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", background: "#f0f2f5", padding: 16, borderRadius: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{`${t.lightCar} ${cp("sxemasi")}`}</div>
        {/* Oldi qator */}
        <div style={{ display: "flex", gap: 20 }}>
          <div style={driverSeatStyle}>Rul</div>
          <div style={seatStyle("A1")} onClick={() => onToggleSeat("A1")}>A1</div>
        </div>
        {/* Orqa qator */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={seatStyle("B1")} onClick={() => onToggleSeat("B1")}>B1</div>
          <div style={seatStyle("B2")} onClick={() => onToggleSeat("B2")}>B2</div>
          <div style={seatStyle("B3")} onClick={() => onToggleSeat("B3")}>B3</div>
        </div>
      </div>
    );
  }

  // Avtobus yoki Gazel (Kataklar)
  return (
    <div style={{ background: "#f0f2f5", padding: 16, borderRadius: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, textAlign: "center" }}>
        {trip.vehicle_type === 'bus' ? t.bus : `${t.gazelle}/Mikroavtobus`} ({totalSeats} {cp("o'rin")})
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        {Array.from({ length: totalSeats }).map((_, i) => {
          const id = i + 1;
          return (
            <div key={id} style={seatStyle(id)} onClick={() => onToggleSeat(id)}>
              {id}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TripCard({ trip, onViewMap, onSelect }) {
  const { t, cp } = useClientText();
  const titleFrom = trip.from_district ? `${trip.from_region} • ${trip.from_district}` : trip.from_region;
  const titleTo = trip.to_district ? `${trip.to_region} • ${trip.to_district}` : trip.to_region;

  return (
    <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 14, marginBottom: 10, background: "#fff" }}>
      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>{titleFrom} → {titleTo}</div>
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        <Tag color="blue">{trip.vehicle_type === 'bus' ? t.bus : trip.vehicle_type === 'gazel' ? t.gazelle : t.lightCar}</Tag>
        {trip.has_ac && <Tag color="cyan">AC</Tag>}
        {trip.has_trunk && <Tag color="purple">{t.trunk}</Tag>}
        {trip.women_only && <Tag color="magenta">{t.womenOnlyTag}</Tag>}
      </div>

      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>
        <div>📅 {trip.depart_date} {trip.depart_time ? `⏰ ${String(trip.depart_time).slice(0,5)}` : ""}</div>
        <div style={{ fontWeight: 600, marginTop: 4 }}>
          💺 {trip.seats} ta joy • {trip.price ? `${trip.price.toLocaleString()} so'm` : t.agreed}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Button onClick={() => onViewMap(trip)} icon={<EnvironmentOutlined />} block>{t.routeView}</Button>
        <Button type="primary" onClick={() => onSelect(trip)} block>{t.choose}</Button>
      </div>
    </div>
  );
}

export default function ClientIntercityPage() {
  const navigate = useNavigate();
  const { t, cp } = useClientText();
  
  // Search State
  const [from, setFrom] = useState({ region: null, district: "" });
  const [to, setTo] = useState({ region: null, district: "" });
  const [travelDate, setTravelDate] = useState(null);
  
  // Filters
  const [vehicleType, setVehicleType] = useState("all"); 
  const [womenOnly, setWomenOnly] = useState(false);
  const [hasAC, setHasAC] = useState(false);
  const [hasTrunk, setHasTrunk] = useState(false);
  
  // Locations
  const fromLL = useMemo(() => (from.region ? getRegionCenter(from.region) : null), [from.region]);
  const toLL = useMemo(() => (to.region ? getRegionCenter(to.region) : null), [to.region]);

  // Route calculation
  const [routePolyline, setRoutePolyline] = useState(null);
  const [routeDistance, setRouteDistance] = useState(0);

  useEffect(() => {
    // Marshrutni hisoblash (To'g'ri chiziq emas, OSRM yo'l bo'ylab)
    if (fromLL && toLL) {
      osrmRouteDriving([fromLL, toLL]).then((res) => {
        if (res) {
          setRoutePolyline(res.coords);
          setRouteDistance(res.distance_m / 1000);
        } else {
          // Agar OSRM ishlamasa, to'g'ri chiziq
          setRoutePolyline([fromLL, toLL]);
          setRouteDistance(haversineKm(fromLL, toLL));
        }
      });
    } else {
      setRoutePolyline(null);
      setRouteDistance(0);
    }
  }, [fromLL, toLL]);

  const canSearch = Boolean(from.region && to.region);

  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [mapTrip, setMapTrip] = useState(null);

  // Pickup configuration
  const [pickupMode, setPickupMode] = useState("point"); // 'point' (belgilangan joy) | 'address' (manzildan)
  const [pickupPickerOpen, setPickupPickerOpen] = useState(false);
  const [pickupPoint, setPickupPoint] = useState(null);
  const [pickupAddressName, setPickupAddressName] = useState(""); // Manzil nomi
  const [savedPickupPoints, setSavedPickupPoints] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  // Booking State
  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    setSavedPickupPoints(loadSavedPickupPoints());
  }, []);

  const searchTrips = useCallback(async () => {
    if (!canSearch) return;

    setLoading(true);
    try {
      const dateStr = travelDate ? travelDate.format("YYYY-MM-DD") : null;

      let q = supabase
        .from("interprov_trips")
        .select("*")
        .eq("from_region", from.region)
        .eq("to_region", to.region)
        .order("depart_date", { ascending: true })
        .limit(50);

      // Asosiy filtrlar
      if (from.district) q = q.eq("from_district", from.district);
      if (to.district) q = q.eq("to_district", to.district);
      if (dateStr) q = q.eq("depart_date", dateStr);

      // Qo'shimcha filtrlar
      if (vehicleType !== 'all') q = q.eq("vehicle_type", vehicleType);
      if (womenOnly) q = q.eq("women_only", true);
      if (hasAC) q = q.eq("has_ac", true);
      if (hasTrunk) q = q.eq("has_trunk", true);

      const { data, error } = await q;
      if (error) throw error;

      setTrips(data || []);
      setDrawerOpen(true);
      if ((data || []).length === 0) message.info(cp("Mos reys topilmadi"));
    } catch (e) {
      console.error(e);
      message.error(cp("Qidirishda xatolik"));
    } finally {
      setLoading(false);
    }
  }, [canSearch, from, to, travelDate, vehicleType, womenOnly, hasAC, hasTrunk]);

  const viewTripOnMap = useCallback((trip) => {
    const f = getRegionCenter(trip.from_region);
    const t = getRegionCenter(trip.to_region);
    if (f && t) {
      osrmRouteDriving([f, t]).then(res => {
        setMapTrip({ 
          ...trip, 
          routeLine: res ? res.coords : [f, t],
          distanceVal: res ? res.distance_m / 1000 : haversineKm(f, t)
        });
      });
    } else {
      setMapTrip(trip);
    }
  }, []);

  // O'rindiq tanlash logikasi
  const handleToggleSeat = (seatId) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) return prev.filter(s => s !== seatId);
      return [...prev, seatId];
    });
  };

  const handleBookingStart = (trip) => {
    setSelectedTrip(trip);
    setSelectedSeats([]);
    setBookingDrawerOpen(true);
  };

  const handleConfirmBooking = () => {
    if (selectedSeats.length === 0) {
      message.error("Kamida bitta o'rindiq tanlang!");
      return;
    }
    // Bu yerda serverga booking yuborish logikasi bo'ladi
    message.success(`${selectedSeats.length} ta joy (${selectedSeats.join(", ")}) bron qilindi!`);
    setBookingDrawerOpen(false);
    setDrawerOpen(false);
  };

  return (
    <div style={{ padding: 16, maxWidth: 820, margin: "0 auto", paddingBottom: 80 }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Viloyatlar aro qatnov</div>

      {/* MAP PREVIEW */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #eee", marginBottom: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ height: 200, position: "relative" }}>
          <MapContainer
            center={fromLL || toLL || [41.31, 69.24]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            scrollWheelZoom={false}
          >
            <TileLayer url={mapTile} />
            <FitBounds points={routePolyline || [fromLL, toLL]} />
            {fromLL && <Marker position={fromLL} />}
            {toLL && <Marker position={toLL} />}
            {routePolyline && <Polyline positions={routePolyline} pathOptions={{ weight: 5, opacity: 0.8, color: "#1890ff" }} />}
          </MapContainer>
          {routeDistance > 0 && (
            <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(255,255,255,0.95)", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 800, zIndex: 500, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
              {Math.round(routeDistance)} km
            </div>
          )}
        </div>
      </div>

      {/* SEARCH FORM */}
      <div style={{ display: "grid", gap: 12 }}>
        <RegionDistrictSelect
          label="Qayerdan"
          region={from.region}
          district={from.district}
          onChange={(val) => setFrom(val)}
          allowEmptyDistrict
        />
        
        {/* PICKUP TOGGLE */}
        <div style={{ background: "#f5f5f5", padding: 10, borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: pickupMode === 'address' ? 10 : 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Manzildan olib ketish</span>
            <Switch 
              checked={pickupMode === 'address'} 
              onChange={(v) => setPickupMode(v ? 'address' : 'point')} 
            />
          </div>
          {pickupMode === 'address' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Button 
                type={pickupPoint ? "default" : "dashed"} 
                icon={<EnvironmentOutlined />} 
                block 
                onClick={() => {
                  if (!fromLL) { message.warning("Avval viloyatni tanlang"); return; }
                  setPickupPoint(pickupPoint || fromLL); 
                  setPickupPickerOpen(true); 
                }}
              >
                Xaritadan manzilni tanlash
              </Button>
              {pickupAddressName && (
                <div style={{ fontSize: 12, color: "#666", background: "#fff", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}>
                  📍 {pickupAddressName}
                </div>
              )}
            </div>
          )}
        </div>

        <RegionDistrictSelect
          label="Qayerga"
          region={to.region}
          district={to.district}
          onChange={(val) => setTo(val)}
          allowEmptyDistrict
        />

        <DatePicker 
          placeholder="Ketish sanasi" 
          style={{ width: "100%", height: 42, borderRadius: 10 }} 
          onChange={setTravelDate} 
        />

        {/* FILTERS */}
        <div style={{ background: "#fff", padding: 12, borderRadius: 12, border: "1px solid #eee" }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, opacity: 0.7 }}>Transport va qulayliklar</div>
          
          <Segmented 
            block 
            value={vehicleType}
            onChange={setVehicleType}
            options={[
              { label: 'Barchasi', value: 'all' },
              { label: 'Yengil', value: 'car', icon: <CarOutlined /> },
              { label: 'Gazel', value: 'gazel' },
              { label: 'Avtobus', value: 'bus' },
            ]}
            style={{ marginBottom: 12 }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Checkbox checked={womenOnly} onChange={e => setWomenOnly(e.target.checked)}>
              <WomanOutlined style={{ color: "magenta" }} /> Ayollar uchun
            </Checkbox>
            <Checkbox checked={hasAC} onChange={e => setHasAC(e.target.checked)}>
              <ThunderboltOutlined style={{ color: "blue" }} /> Konditsioner
            </Checkbox>
            <Checkbox checked={hasTrunk} onChange={e => setHasTrunk(e.target.checked)}>
              <InboxOutlined /> Yukxona
            </Checkbox>
          </div>
        </div>

        <Button type="primary" size="large" onClick={searchTrips} disabled={!canSearch} loading={loading} style={{ height: 48, borderRadius: 12, fontWeight: 700 }}>
          Reys izlash
        </Button>
      </div>

      {/* RESULTS DRAWER */}
      <Drawer
        title={`Topilgan reyslar (${trips.length})`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        height="85vh"
        placement="bottom"
        styles={{ body: { padding: 12, background: "#f0f2f5" } }}
      >
        {loading ? <Spin style={{ display: "block", margin: "20px auto" }} /> : 
         trips.length === 0 ? <Empty description="Reys topilmadi" /> : 
         trips.map(t => (
           <TripCard 
             key={t.id} 
             trip={t} 
             onViewMap={viewTripOnMap} 
             onSelect={handleBookingStart} 
           />
         ))
        }
      </Drawer>

      {/* BOOKING DRAWER (Seat Selection) */}
      <Drawer
        title="O'rindiq tanlash"
        open={bookingDrawerOpen}
        onClose={() => setBookingDrawerOpen(false)}
        height="70vh"
        placement="bottom"
      >
        {selectedTrip && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ marginBottom: 16 }}>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {selectedTrip.from_region} → {selectedTrip.to_region}
                </Typography.Title>
                <div style={{ opacity: 0.6 }}>{selectedTrip.vehicle_type === 'bus' ? 'Avtobus' : selectedTrip.vehicle_type === 'gazel' ? 'Gazel' : 'Yengil mashina'}</div>
              </div>

              <SeatSelector 
                trip={selectedTrip} 
                selectedSeats={selectedSeats} 
                onToggleSeat={handleToggleSeat} 
              />

              <div style={{ marginTop: 20, background: "#f9f9f9", padding: 12, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Narx (1 o'rin):</span>
                  <b>{selectedTrip.price?.toLocaleString()} so'm</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 16, fontWeight: 700 }}>
                  <span>Jami ({selectedSeats.length} ta):</span>
                  <span style={{ color: "#1890ff" }}>{(selectedTrip.price * selectedSeats.length).toLocaleString()} so'm</span>
                </div>
              </div>
            </div>
            
            <Button 
              type="primary" 
              size="large" 
              block 
              disabled={selectedSeats.length === 0}
              onClick={handleConfirmBooking}
              style={{ marginTop: 10 }}
            >
              Bron qilish
            </Button>
          </div>
        )}
      </Drawer>

      {/* MAP DRAWER (View Route) */}
      <Drawer
        title="Yo‘nalish xaritasi"
        open={Boolean(mapTrip)}
        onClose={() => setMapTrip(null)}
        height="70vh"
        placement="bottom"
      >
        {mapTrip && (
          <div style={{ height: "100%", width: "100%", position: "relative" }}>
            <MapContainer center={[41.31, 69.24]} zoom={6} style={{ height: "100%", width: "100%" }}>
              <TileLayer url={mapTile} />
              <FitBounds points={mapTrip.routeLine} />
              {mapTrip.routeLine && <Polyline positions={mapTrip.routeLine} pathOptions={{ weight: 6, color: "blue" }} />}
            </MapContainer>
            <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, background: "#fff", padding: 12, borderRadius: 12, boxShadow: "0 4px 15px rgba(0,0,0,0.15)", zIndex: 999 }}>
              <div style={{ fontWeight: 700 }}>{mapTrip.from_region} → {mapTrip.to_region}</div>
              <div>Masofa: ~{Math.round(mapTrip.distanceVal || 0)} km</div>
            </div>
          </div>
        )}
      </Drawer>

      {/* PICKUP MAP PICKER DRAWER */}
      <Drawer
        title="Olib ketish manzilini tanlang"
        open={pickupPickerOpen}
        onClose={() => setPickupPickerOpen(false)}
        height="85vh"
        placement="bottom"
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <MapContainer center={pickupPoint || [41.31, 69.24]} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer url={mapTile} />
              <PickupPicker 
                value={pickupPoint} 
                onChange={async (ll) => {
                  setPickupPoint(ll);
                  const name = await getAddressName(ll[0], ll[1]);
                  setPickupAddressName(name);
                  savePickupPoint(ll);
                  setSavedPickupPoints(loadSavedPickupPoints());
                }} 
                savedPoints={savedPickupPoints}
              />
            </MapContainer>
            <div style={{ position: "absolute", top: 10, left: 10, right: 10, zIndex: 1000, background: "rgba(255,255,255,0.9)", padding: 8, borderRadius: 8, fontSize: 12, textAlign: "center", fontWeight: 600 }}>
              {pickupAddressName || "Xaritadan joy tanlang"}
            </div>
          </div>
          <div style={{ padding: 16, background: "#fff" }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Saqlangan manzillar:</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
              {savedPickupPoints.map((p, i) => (
                <Tag key={i} color="blue" onClick={async () => {
                  setPickupPoint(p);
                  const name = await getAddressName(p[0], p[1]);
                  setPickupAddressName(name);
                }} style={{ padding: "4px 10px" }}>
                  Manzil {i+1}
                </Tag>
              ))}
            </div>
            <Button type="primary" block size="large" onClick={() => setPickupPickerOpen(false)}>
              Manzilni tasdiqlash
            </Button>
          </div>
        </div>
      </Drawer>

      <div style={{ marginTop: 24 }}>
        <AutoMarketAdsPanel 
          title="Avto savdo e’lonlari" 
          mode="mini" 
          onOpenAd={(id) => navigate(`/auto-market/ad/${id}`)} 
          fetchAds={listMarketCars} 
        />
      </div>

    </div>
  );
}