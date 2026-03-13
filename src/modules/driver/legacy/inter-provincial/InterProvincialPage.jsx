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
  Spin
} from "antd";
import { 
  EnvironmentOutlined, 
  CarOutlined, 
  ThunderboltOutlined, 
  InboxOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";

import RegionDistrictSelect from "@/modules/shared/components/RegionDistrictSelect";
import { UZ_REGIONS } from "@/modules/shared/constants/uzRegions";
import { supabase } from "@/services/supabase/supabaseClient";
// DIQQAT: haversineKm bu yerdan import qilinadi, pastda qayta yozilmaydi
import { osrmRouteDriving, haversineKm } from "@/modules/shared/services/osrm";
import { useAuth } from "@/modules/shared/auth/AuthProvider";
import { getTripSettings, saveTripSettings } from "@/modules/client/features/client/delivery/services/deliveryStore.js";
import { useDriverOnline } from "@/modules/driver/legacy/core/useDriverOnline.js";
import { canUseOrderTypeInArea } from "@/modules/driver/legacy/core/driverCapabilityService.js";
import { useDriverText } from "@/modules/driver/legacy/shared/i18n_driverLocalize.js";

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
        {trip.is_delivery && <Tag color="gold">Eltish</Tag>}
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
  const { cp } = useDriverText();
  const { user } = useAuth();
  const { serviceTypes, activeVehicle } = useDriverOnline();

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
  const [deliveryMaxKg, setDeliveryMaxKg] = useState(5);
  const [deliveryMaxOrders, setDeliveryMaxOrders] = useState(4);
  const [deliveryMaxTotalKg, setDeliveryMaxTotalKg] = useState(15);
  const [deliveryPrecisePickup, setDeliveryPrecisePickup] = useState(true);
  const [deliveryPreciseDropoff, setDeliveryPreciseDropoff] = useState(false);
  
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

  const intercityPassengerEnabled = useMemo(() => canUseOrderTypeInArea({ serviceTypes }, "intercity", "passenger"), [serviceTypes]);
  const intercityDeliveryEnabled = useMemo(() => canUseOrderTypeInArea({ serviceTypes }, "intercity", "delivery"), [serviceTypes]);
  const intercityFreightEnabled = useMemo(() => canUseOrderTypeInArea({ serviceTypes }, "intercity", "freight"), [serviceTypes]);
  const intercityMaxWeightKg = useMemo(() => Number(activeVehicle?.maxWeightKg || 0), [activeVehicle]);
  const intercityMaxVolumeM3 = useMemo(() => Number(activeVehicle?.maxVolumeM3 || 0), [activeVehicle]);

  useEffect(() => { setSavedLocs(loadSavedLocations()); }, []);

  useEffect(() => {
    if (!intercityDeliveryEnabled && isDelivery) setIsDelivery(false);
  }, [intercityDeliveryEnabled, isDelivery]);

  useEffect(() => {
    if (!intercityFreightEnabled && isParcel) setIsParcel(false);
  }, [intercityFreightEnabled, isParcel]);

  useEffect(() => {
    if (intercityMaxWeightKg > 0) {
      setDeliveryMaxKg((prev) => Math.min(Number(prev || 0), intercityMaxWeightKg || Number(prev || 0)));
      setDeliveryMaxTotalKg((prev) => Math.min(Number(prev || 0), intercityMaxWeightKg || Number(prev || 0)));
    }
  }, [intercityMaxWeightKg]);

  const loadMyTrips = useCallback(async () => {
    if (!user?.id) return;
    setLoadingTrips(true);
    try {
      const { data, error } = await supabase
        .from("interprov_trips")
        .select("*")
        .eq("driver_user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTrips(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrips(false);
    }
  }, [user?.id]);

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
    setDeliveryMaxKg(5);
    setDeliveryMaxOrders(4);
    setDeliveryMaxTotalKg(15);
    setDeliveryPrecisePickup(true);
    setDeliveryPreciseDropoff(false);
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
    setTravelTime(trip.depart_time ? dayjs(trip.depart_time, "HH:mm") : null);
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
    const deliverySettings = getTripSettings(trip.id);
    setDeliveryMaxKg(Number(deliverySettings?.maxKg || 5));
    setDeliveryMaxOrders(Number(deliverySettings?.maxOrders || 4));
    setDeliveryMaxTotalKg(Number(deliverySettings?.maxTotalKg || 15));
    setDeliveryPrecisePickup(Boolean(deliverySettings?.precisePickup ?? true));
    setDeliveryPreciseDropoff(Boolean(deliverySettings?.preciseDropoff ?? false));
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
    // 1. Validatsiya
    if (!user?.id) return message.error("Tizimga kirilmagan");
    if (!from.region || !to.region) return message.error("Yo'nalishni (Viloyat) tanlang");
    if (!travelDate) return message.error("Sanani tanlang");
    if (!travelTime) return message.error("Vaqtni tanlang");
    if (seats <= 0) return message.error("O'rinlar sonini kiriting");

    // Narx validatsiyasi
    if (vehicleType === 'car') {
        if (!priceFront || priceFront <= 0) return message.error("Oldi o'rindiq narxini kiriting");
        if (!priceBack || priceBack <= 0) return message.error("Orqa o'rindiq narxini kiriting");
    } else {
        if (!price || price <= 0) return message.error("Narxni kiriting");
    }

    if (!intercityPassengerEnabled) return message.error("Viloyatlararo yo‘lovchi xizmati Sozlamalarda yoqilmagan");
    if (isDelivery && !intercityDeliveryEnabled) return message.error("Viloyatlararo eltish xizmati yoqilmagan");
    if (isParcel && !intercityFreightEnabled) return message.error("Viloyatlararo yuk tashish xizmati yoqilmagan");
    if (isDelivery && intercityMaxWeightKg > 0 && Number(deliveryMaxTotalKg || 0) > intercityMaxWeightKg) return message.error(`Jami eltish limiti aktiv mashina sig‘imidan oshmasin (${intercityMaxWeightKg}kg)`);

    setSaving(true);
    
    const payload = {
      driver_user_id: user.id,
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
      
      // Yangi ustunlar
      price: vehicleType === 'car' ? 0 : Number(price), 
      price_front: vehicleType === 'car' ? Number(priceFront) : null,
      price_back: vehicleType === 'car' ? Number(priceBack) : null,
      bus_seat_type: vehicleType === 'bus' ? busSeatType : null,
      active_vehicle_id: activeVehicle?.id || null,
      allowed_delivery_max_kg: isDelivery ? Number(deliveryMaxKg || 0) : null,
      allowed_delivery_total_kg: isDelivery ? Number(deliveryMaxTotalKg || 0) : null,
      active_vehicle_max_weight_kg: intercityMaxWeightKg || null,
      active_vehicle_max_volume_m3: intercityMaxVolumeM3 || null,
    };

    try {
      if (editingTrip?.id) {
        const { error } = await supabase.from("interprov_trips").update(payload).eq("id", editingTrip.id);
        if (error) throw error;
        saveTripSettings(editingTrip.id, {
          maxKg: deliveryMaxKg,
          maxOrders: deliveryMaxOrders,
          maxTotalKg: deliveryMaxTotalKg,
          precisePickup: deliveryPrecisePickup,
          preciseDropoff: deliveryPreciseDropoff,
        });
        message.success("Reys yangilandi");
      } else {
        const { data: inserted, error } = await supabase.from("interprov_trips").insert(payload).select("id").single();
        if (error) throw error;
        if (inserted?.id) {
          saveTripSettings(inserted.id, {
            maxKg: deliveryMaxKg,
            maxOrders: deliveryMaxOrders,
            maxTotalKg: deliveryMaxTotalKg,
            precisePickup: deliveryPrecisePickup,
            preciseDropoff: deliveryPreciseDropoff,
          });
        }
        message.success("Reys yaratildi");
      }
      resetForm();
      loadMyTrips();
    } catch (e) {
      console.error(e);
      message.error("Saqlashda xatolik: " + e.message);
    } finally {
      setSaving(false);
    }
  }, [user, from, to, travelDate, travelTime, seats, price, priceFront, priceBack, vehicleType, busSeatType, womenOnly, isDelivery, isParcel, hasAC, hasTrunk, note, pickupLL, editingTrip, loadMyTrips, resetForm, deliveryMaxKg, deliveryMaxOrders, deliveryMaxTotalKg, deliveryPrecisePickup, deliveryPreciseDropoff, activeVehicle, intercityPassengerEnabled, intercityDeliveryEnabled, intercityFreightEnabled, intercityMaxWeightKg, intercityMaxVolumeM3]);

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

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: "0 auto", paddingBottom: 80 }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Haydovchi paneli</div>

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
          <Checkbox disabled={!intercityDeliveryEnabled} checked={isDelivery} onChange={e => setIsDelivery(e.target.checked)}>Pochta / Eltish {!intercityDeliveryEnabled ? "(Sozlamada o‘chiq)" : ""}</Checkbox>
          <Checkbox checked={hasAC} onChange={e => setHasAC(e.target.checked)}>Konditsioner</Checkbox>
          <Checkbox disabled={!intercityFreightEnabled} checked={isParcel} onChange={e => setIsParcel(e.target.checked)}>Yuk tashish {!intercityFreightEnabled ? "(Sozlamada o‘chiq)" : ""}</Checkbox>
          <Checkbox checked={hasTrunk} onChange={e => setHasTrunk(e.target.checked)}>Yukxona</Checkbox>
        </div>

        {isDelivery ? (
          <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #eee" }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Aktiv mashina limiti: {intercityMaxWeightKg || 0}kg • {intercityMaxVolumeM3 || 0}m³</div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Eltish sozlamalari</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Bitta buyum max kg</div>
                <InputNumber style={{ width: "100%" }} min={1} max={Math.max(1, intercityMaxWeightKg || 20)} value={deliveryMaxKg} onChange={setDeliveryMaxKg} />
              </div>
              <div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Maksimal buyurtma soni</div>
                <InputNumber style={{ width: "100%" }} min={1} max={10} value={deliveryMaxOrders} onChange={setDeliveryMaxOrders} />
              </div>
              <div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Jami kg limiti</div>
                <InputNumber style={{ width: "100%" }} min={1} max={Math.max(1, intercityMaxWeightKg || 100)} value={deliveryMaxTotalKg} onChange={setDeliveryMaxTotalKg} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <Checkbox checked={deliveryPrecisePickup} onChange={e => setDeliveryPrecisePickup(e.target.checked)}>Aniq pickup olaman</Checkbox>
              <Checkbox checked={deliveryPreciseDropoff} onChange={e => setDeliveryPreciseDropoff(e.target.checked)}>Aniq dropoff olib boraman</Checkbox>
            </div>
          </div>
        ) : null}

        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Izoh (ixtiyoriy)</div>
          <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Masalan: yo‘lda 1 ta joy, posilka ham olaman..." />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {/* TUGMA DISABLED EMAS, BOSILGANDA VALIDATSIYA QILADI */}
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
