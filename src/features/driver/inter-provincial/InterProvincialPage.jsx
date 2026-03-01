import React, { useCallback, useEffect, useMemo, useState } from "react";
import { 
  Button, 
  DatePicker, 
  Input, 
  InputNumber, 
  Switch, 
  message, 
  Modal, 
  Drawer, 
  Empty, 
  Select, 
  Checkbox, 
  Radio, 
  Tag, 
  Segmented, 
  TimePicker, 
  Spin,
  Alert
} from "antd";
import { 
  EnvironmentOutlined, 
  CarOutlined, 
  ThunderboltOutlined, 
  InboxOutlined, 
  ClockCircleOutlined,
  UserOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";

import RegionDistrictSelect from "@/shared/components/RegionDistrictSelect";
import { UZ_REGIONS } from "@/shared/constants/uzRegions";
import { supabase } from "@/services/supabaseClient";
import { osrmRouteDriving, haversineKm } from "@/shared/services/osrm";
import { useAuth } from "@/shared/auth/AuthProvider";

import "leaflet/dist/leaflet.css";

// Marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function getRegionCenter(regionName) {
  const r = UZ_REGIONS.find((x) => x.name === regionName);
  return r?.center || null;
}

// Manzil nomini aniqlash
async function getAddressName(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz`);
    const data = await res.json();
    return data.display_name || "Belgilangan joy";
  } catch (e) {
    return "Noma'lum manzil";
  }
}

function loadSavedLocations() {
  try { return JSON.parse(localStorage.getItem("driver_saved_locs") || "[]"); } catch { return []; }
}

function saveLocation(pt) {
  if(!pt) return;
  const list = loadSavedLocations();
  const next = [pt, ...list].filter((v, i, a) => a.findIndex(t => (t[0] === v[0] && t[1] === v[1])) === i).slice(0, 6);
  localStorage.setItem("driver_saved_locs", JSON.stringify(next));
}

// --- Map Components ---

function MapPickerEvents({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function TripRow({ trip, onEdit, onDelete, onShowMap }) {
  const titleFrom = trip.from_district ? `${trip.from_region} • ${trip.from_district}` : trip.from_region;
  const titleTo = trip.to_district ? `${trip.to_region} • ${trip.to_district}` : trip.to_region;
  
  let priceDisplay = "";
  if (trip.vehicle_type === 'car') {
    priceDisplay = `Oldi: ${trip.price_front?.toLocaleString()} | Orqa: ${trip.price_back?.toLocaleString()}`;
  } else {
    const typeLabel = trip.vehicle_type === 'bus' && trip.bus_seat_type === 'sleeping' ? '(Yotib)' : '(O\'tirib)';
    priceDisplay = `${trip.price?.toLocaleString()} so'm ${typeLabel}`;
  }

  return (
    <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 12, marginBottom: 10, background: "#fff" }}>
      <div style={{ fontWeight: 800, marginBottom: 4, fontSize: 15 }}>{titleFrom} → {titleTo}</div>
      
      <div style={{ display: "flex", gap: 6, margin: "6px 0", flexWrap: "wrap" }}>
        <Tag color="blue">{trip.vehicle_type === 'bus' ? 'Avtobus' : trip.vehicle_type === 'gazel' ? 'Gazel' : 'Yengil'}</Tag>
        {trip.has_ac && <Tag color="cyan">AC</Tag>}
        {trip.has_trunk && <Tag color="purple">Yukxona</Tag>}
        {trip.women_only && <Tag color="magenta">Ayollar</Tag>}
      </div>

      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>
        📅 {trip.depart_date} {trip.depart_time ? `⏰ ${String(trip.depart_time).slice(0,5)}` : ""}
        <br/>
        💰 <b>{priceDisplay}</b> • {trip.seats} o'rin
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Button size="small" onClick={() => onShowMap(trip)} icon={<EnvironmentOutlined />}>Yo‘l</Button>
        <Button size="small" onClick={() => onEdit(trip)}>Tahrir</Button>
        <Button size="small" danger onClick={() => onDelete(trip)}>O‘chirish</Button>
      </div>
    </div>
  );
}

export default function InterProvincialPage() {
  const { user: authUser } = useAuth(); // AuthContext dan user
  const [currentUser, setCurrentUser] = useState(null); // Haqiqiy user (backup bilan)

  // Userni aniqlash (AuthContext ishlamasa, to'g'ridan-to'g'ri Supabase'dan olamiz)
  useEffect(() => {
    const checkUser = async () => {
      // 1-urinish: Context dagi user
      if (authUser?.id) {
        setCurrentUser(authUser);
        return;
      }
      
      // 2-urinish: Supabase'dan to'g'ridan-to'g'ri so'rash
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    };
    checkUser();
  }, [authUser]);

  // Basic Info
  const [from, setFrom] = useState({ region: null, district: "" });
  const [to, setTo] = useState({ region: null, district: "" });
  const [travelDate, setTravelDate] = useState(null);
  const [travelTime, setTravelTime] = useState(null);
  
  // Details
  const [vehicleType, setVehicleType] = useState("car"); // car, gazel, bus
  const [seats, setSeats] = useState(4);
  
  // Pricing
  const [price, setPrice] = useState(50000); 
  const [priceFront, setPriceFront] = useState(70000); 
  const [priceBack, setPriceBack] = useState(50000); 
  const [busSeatType, setBusSeatType] = useState("sitting"); 
  
  // Features
  const [womenOnly, setWomenOnly] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [isParcel, setIsParcel] = useState(false);
  const [hasAC, setHasAC] = useState(false);
  const [hasTrunk, setHasTrunk] = useState(false);
  
  const [note, setNote] = useState("");

  // Location logic
  const [pickupLL, setPickupLL] = useState(null);
  const [pickupAddress, setPickupAddress] = useState("");
  
  // Map visualization
  const fromLL = useMemo(() => (from.region ? getRegionCenter(from.region) : null), [from.region]);
  const toLL = useMemo(() => (to.region ? getRegionCenter(to.region) : null), [to.region]);
  
  const [routeCoords, setRouteCoords] = useState(null);
  const [routeDist, setRouteDist] = useState(0);

  useEffect(() => {
    if (fromLL && toLL) {
      osrmRouteDriving([fromLL, toLL]).then(res => {
        if (res) {
          setRouteCoords(res.coords);
          setRouteDist(res.distance_m / 1000);
        } else {
          setRouteCoords([fromLL, toLL]);
          setRouteDist(haversineKm(fromLL, toLL));
        }
      });
    } else {
      setRouteCoords(null);
      setRouteDist(0);
    }
  }, [fromLL, toLL]);

  // Data state
  const [saving, setSaving] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  // Map Drawers
  const [mapDrawerOpen, setMapDrawerOpen] = useState(false);
  const [mapTrip, setMapTrip] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false); 
  const [savedLocs, setSavedLocs] = useState([]);

  useEffect(() => { setSavedLocs(loadSavedLocations()); }, []);

  const loadMyTrips = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoadingTrips(true);
    try {
      const { data, error } = await supabase
        .from("interprov_trips")
        .select("*")
        .eq("driver_user_id", currentUser.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTrips(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrips(false);
    }
  }, [currentUser?.id]);

  useEffect(() => { loadMyTrips(); }, [loadMyTrips]);

  const resetForm = useCallback(() => {
    setFrom({ region: null, district: "" });
    setTo({ region: null, district: "" });
    setTravelDate(null);
    setTravelTime(null);
    setSeats(4);
    setPrice(50000);
    setPriceFront(70000);
    setPriceBack(50000);
    setVehicleType("car");
    setBusSeatType("sitting");
    setWomenOnly(false);
    setIsDelivery(false);
    setIsParcel(false);
    setHasAC(false);
    setHasTrunk(false);
    setNote("");
    setPickupLL(null);
    setPickupAddress("");
    setEditingTrip(null);
  }, []);

  const startEdit = useCallback((trip) => {
    setEditingTrip(trip);
    setFrom({ region: trip.from_region, district: trip.from_district || "" });
    setTo({ region: trip.to_region, district: trip.to_district || "" });
    setTravelDate(trip.depart_date ? dayjs(trip.depart_date) : null);
    setTravelTime(trip.depart_time ? dayjs(trip.depart_time, "HH:mm:ss") : null);
    setSeats(trip.seats || 4);
    setPrice(trip.price || 0);
    setPriceFront(trip.price_front || 0);
    setPriceBack(trip.price_back || 0);
    setVehicleType(trip.vehicle_type || "car");
    setBusSeatType(trip.bus_seat_type || "sitting");
    setWomenOnly(Boolean(trip.women_only));
    setIsDelivery(Boolean(trip.is_delivery));
    setIsParcel(Boolean(trip.is_parcel));
    setHasAC(Boolean(trip.has_ac));
    setHasTrunk(Boolean(trip.has_trunk));
    setNote(trip.note || "");
    
    if (trip.pickup_lat && trip.pickup_lng) {
      setPickupLL([trip.pickup_lat, trip.pickup_lng]);
      getAddressName(trip.pickup_lat, trip.pickup_lng).then(setPickupAddress);
    } else {
      setPickupLL(null);
      setPickupAddress("");
    }
  }, []);

  const createOrUpdate = useCallback(async () => {
    // 1. Userni tekshirish
    if (!currentUser?.id) {
      // Qayta urinib ko'rish
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        message.error("Tizimga kirilmagan! Iltimos, qayta login qiling.");
        return;
      }
    }
    
    const activeUserId = currentUser?.id || (await supabase.auth.getUser()).data.user?.id;

    if (!from.region || !to.region) return message.error("Yo'nalishni (Viloyat) tanlang");
    if (!travelDate) return message.error("Sanani tanlang");
    if (!travelTime) return message.error("Vaqtni tanlang");
    if (seats <= 0) return message.error("O'rinlar sonini kiriting");

    if (vehicleType === 'car') {
        if (!priceFront || priceFront <= 0) return message.error("Oldi o'rindiq narxini kiriting");
        if (!priceBack || priceBack <= 0) return message.error("Orqa o'rindiq narxini kiriting");
    } else {
        if (!price || price <= 0) return message.error("Narxni kiriting");
    }

    setSaving(true);
    
    const payload = {
      driver_user_id: activeUserId,
      from_region: from.region,
      from_district: from.district || null,
      to_region: to.region,
      to_district: to.district || null,
      depart_date: travelDate.format("YYYY-MM-DD"),
      depart_time: travelTime.format("HH:mm"),
      seats: Number(seats),
      vehicle_type: vehicleType,
      women_only: womenOnly,
      is_delivery: isDelivery,
      is_parcel: isParcel,
      has_ac: hasAC,
      has_trunk: hasTrunk,
      note: note || null,
      pickup_lat: pickupLL ? pickupLL[0] : null,
      pickup_lng: pickupLL ? pickupLL[1] : null,
      
      price: vehicleType === 'car' ? 0 : Number(price), 
      price_front: vehicleType === 'car' ? Number(priceFront) : null,
      price_back: vehicleType === 'car' ? Number(priceBack) : null,
      bus_seat_type: vehicleType === 'bus' ? busSeatType : null,
    };

    try {
      if (editingTrip?.id) {
        const { error } = await supabase.from("interprov_trips").update(payload).eq("id", editingTrip.id);
        if (error) throw error;
        message.success("Yangilandi");
      } else {
        const { error } = await supabase.from("interprov_trips").insert(payload);
        if (error) throw error;
        message.success("Reys yaratildi");
      }
      resetForm();
      loadMyTrips();
    } catch (e) {
      console.error(e);
      message.error("Xatolik: " + (e.message || "Baza bilan ulanishda xato"));
    } finally {
      setSaving(false);
    }
  }, [currentUser, from, to, travelDate, travelTime, seats, price, priceFront, priceBack, vehicleType, busSeatType, womenOnly, isDelivery, isParcel, hasAC, hasTrunk, note, pickupLL, editingTrip, loadMyTrips, resetForm]);

  const deleteTrip = useCallback(async (trip) => {
    Modal.confirm({
      title: "O'chirishni tasdiqlaysizmi?",
      okText: "O'chirish", okButtonProps: { danger: true },
      onOk: async () => {
        const { error } = await supabase.from("interprov_trips").delete().eq("id", trip.id);
        if(!error) {
          message.success("O'chirildi");
          loadMyTrips();
        } else {
          message.error("O'chirishda xatolik");
        }
      }
    });
  }, [loadMyTrips]);

  const showRouteMap = (trip) => {
    const f = getRegionCenter(trip.from_region);
    const t = getRegionCenter(trip.to_region);
    if(f && t) {
      osrmRouteDriving([f, t]).then(res => {
        setMapTrip({ ...trip, routeCoords: res?.coords || [f, t] });
        setMapDrawerOpen(true);
      });
    }
  };

  // Validatsiya
  const canCreate = Boolean(
    from.region && 
    to.region && 
    travelDate && 
    travelTime && 
    seats > 0 && 
    ((vehicleType === 'car' && priceFront > 0 && priceBack > 0) || (vehicleType !== 'car' && price > 0))
  );

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: "0 auto", paddingBottom: 80 }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Haydovchi paneli</div>

      {/* USER STATUS DEBUG */}
      <div style={{ marginBottom: 16 }}>
        {currentUser ? (
          <Alert message={`Faol haydovchi: ${currentUser.email}`} type="success" showIcon />
        ) : (
          <Alert message="Siz tizimga kirmagansiz (Login talab qilinadi)" type="error" showIcon />
        )}
      </div>

      {/* MAP PREVIEW */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #ddd", marginBottom: 16 }}>
        <div style={{ height: 220 }}>
          <MapContainer center={fromLL || toLL || [41.31, 69.24]} zoom={6} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {fromLL && <Marker position={fromLL} />}
            {toLL && <Marker position={toLL} />}
            {pickupLL && <Marker position={pickupLL} />}
            {routeCoords && <Polyline positions={routeCoords} pathOptions={{ weight: 5, color: "blue" }} />}
          </MapContainer>
        </div>
        <div style={{ padding: 8, fontSize: 12, background: "#f9f9f9" }}>
          Masofa: <b>{Math.round(routeDist)} km</b> (taxminiy)
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <RegionDistrictSelect label="Qayerdan" region={from.region} district={from.district} onChange={setFrom} allowEmptyDistrict />
        
        {/* PICKUP BUTTON */}
        <div style={{ background: "#fff", padding: 10, borderRadius: 8, border: "1px solid #d9d9d9" }}>
          <Button 
            type={pickupLL ? "primary" : "dashed"}
            icon={<EnvironmentOutlined />} 
            block 
            onClick={() => {
              if(!fromLL) { message.warning("Avval viloyatni tanlang"); return; }
              setPickupLL(pickupLL || fromLL);
              setPickerOpen(true);
            }}
          >
            {pickupLL ? "Manzil belgilandi (O'zgartirish)" : "Ketish joyini xaritadan belgilash"}
          </Button>
          {pickupAddress && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#666", display: "flex", gap: 6, alignItems: 'center' }}>
              <EnvironmentOutlined style={{ color: "red" }} /> 
              <span>{pickupAddress}</span>
            </div>
          )}
        </div>

        <RegionDistrictSelect label="Qayerga" region={to.region} district={to.district} onChange={setTo} allowEmptyDistrict />

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Sana</div>
            <DatePicker style={{ width: "100%" }} value={travelDate} onChange={setTravelDate} placeholder="Kunni tanlang" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Vaqt</div>
            <TimePicker 
              style={{ width: "100%" }} 
              value={travelTime} 
              onChange={setTravelTime} 
              format="HH:mm" 
              placeholder="08:30" 
            />
          </div>
        </div>

        {/* VEHICLE & PRICE */}
        <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #eee" }}>
          <div style={{ marginBottom: 10, fontWeight: 600 }}>Mashina turi</div>
          <Segmented block value={vehicleType} onChange={setVehicleType} options={[
            { label: 'Yengil', value: 'car' }, { label: 'Gazel', value: 'gazel' }, { label: 'Avtobus', value: 'bus' }
          ]} />
          
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>O'rinlar soni</div>
            <InputNumber style={{ width: "100%" }} min={1} max={55} value={seats} onChange={setSeats} />
          </div>

          <div style={{ marginTop: 12, borderTop: "1px dashed #eee", paddingTop: 12 }}>
            {vehicleType === 'car' ? (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, marginBottom: 2 }}>Oldi o'rindiq narxi</div>
                  <InputNumber 
                    style={{ width: "100%" }} 
                    min={0} step={1000} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    value={priceFront} onChange={setPriceFront} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, marginBottom: 2 }}>Orqa o'rindiq narxi</div>
                  <InputNumber 
                    style={{ width: "100%" }} 
                    min={0} step={1000} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    value={priceBack} onChange={setPriceBack} 
                  />
                </div>
              </div>
            ) : vehicleType === 'bus' ? (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, marginRight: 10 }}>Joy turi:</span>
                  <Radio.Group value={busSeatType} onChange={e => setBusSeatType(e.target.value)} size="small">
                    <Radio.Button value="sitting">O'tirib ketish</Radio.Button>
                    <Radio.Button value="sleeping">Yotib ketish</Radio.Button>
                  </Radio.Group>
                </div>
                <div style={{ fontSize: 12, marginBottom: 2 }}>Narx (1 o'rin)</div>
                <InputNumber 
                  style={{ width: "100%" }} 
                  min={0} step={1000} 
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  value={price} onChange={setPrice} 
                />
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, marginBottom: 2 }}>Narx (1 o'rin)</div>
                <InputNumber 
                  style={{ width: "100%" }} 
                  min={0} step={1000} 
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  value={price} onChange={setPrice} 
                />
              </div>
            )}
          </div>
        </div>

        {/* FEATURES */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Checkbox checked={womenOnly} onChange={e => setWomenOnly(e.target.checked)}>Ayollar uchun</Checkbox>
          <Checkbox checked={isDelivery} onChange={e => setIsDelivery(e.target.checked)}>Pochta / Eltish</Checkbox>
          <Checkbox checked={hasAC} onChange={e => setHasAC(e.target.checked)}>Konditsioner</Checkbox>
          <Checkbox checked={hasTrunk} onChange={e => setHasTrunk(e.target.checked)}>Yukxona</Checkbox>
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Izoh (ixtiyoriy)</div>
          <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Masalan: yo‘lda 1 ta joy, posilka ham olaman..." />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {/* TUGMA DISABLED EMAS, BOSILGANDA TEKSHIRADI */}
          <Button type="primary" size="large" onClick={createOrUpdate} loading={saving} block>
            {editingTrip ? "Saqlash" : "Reys yaratish"}
          </Button>
          <Button size="large" onClick={resetForm} block>
            Tozalash
          </Button>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Mening reyslarim</h3>
        {loadingTrips ? <div style={{textAlign:'center', padding:20}}><Spin /></div> : trips.map(t => (
          <TripRow key={t.id} trip={t} onEdit={startEdit} onDelete={deleteTrip} onShowMap={showRouteMap} />
        ))}
      </div>

      {/* MAP PICKER DRAWER */}
      <Drawer
        title="Ketish joyini belgilang"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        height="85vh"
        placement="bottom"
      >
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <MapContainer center={pickupLL || [41.31, 69.24]} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapPickerEvents onPick={async (ll) => {
                setPickupLL(ll);
                saveLocation(ll);
                setSavedLocs(loadSavedLocations());
                const name = await getAddressName(ll[0], ll[1]);
                setPickupAddress(name);
              }} />
              {pickupLL && <Marker position={pickupLL} />}
            </MapContainer>
            <div style={{ position: "absolute", top: 10, left: 10, right: 10, zIndex: 1000, background: "rgba(255,255,255,0.9)", padding: 8, borderRadius: 8, fontSize: 12, textAlign: "center", fontWeight: 600 }}>
              {pickupAddress || "Xaritadan joy ustiga bosing"}
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Saqlanganlar:</div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10 }}>
              {savedLocs.map((l, i) => (
                <Tag key={i} onClick={async () => {
                  setPickupLL(l);
                  const name = await getAddressName(l[0], l[1]);
                  setPickupAddress(name);
                }}>Joy {i+1}</Tag>
              ))}
            </div>
            <Button type="primary" block size="large" onClick={() => setPickerOpen(false)}>Tasdiqlash</Button>
          </div>
        </div>
      </Drawer>

      {/* VIEW TRIP ROUTE DRAWER */}
      <Drawer title="Reys yo'nalishi" open={mapDrawerOpen} onClose={() => setMapDrawerOpen(false)} height="60vh" placement="bottom">
        {mapTrip && (
          <MapContainer center={getRegionCenter(mapTrip.from_region) || [41.31, 69.24]} zoom={6} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {mapTrip.routeCoords && <Polyline positions={mapTrip.routeCoords} />}
            <Marker position={getRegionCenter(mapTrip.from_region)} />
            <Marker position={getRegionCenter(mapTrip.to_region)} />
          </MapContainer>
        )}
      </Drawer>
    </div>
  );
}