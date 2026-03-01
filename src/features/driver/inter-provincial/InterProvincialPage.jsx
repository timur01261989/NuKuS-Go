import React, { useCallback, useEffect, useMemo, useState } from "react";
import { 
  Button, DatePicker, Input, InputNumber, Switch, message, Modal, Drawer, Empty, Select, Checkbox, Radio, Tag, Segmented 
} from "antd";
import { 
  EnvironmentOutlined, CarOutlined, ThunderboltOutlined, InboxOutlined, UsergroupAddOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

import RegionDistrictSelect from "@/shared/components/RegionDistrictSelect";
import { UZ_REGIONS } from "@/shared/constants/uzRegions";
import { supabase } from "@/services/supabaseClient";
import { osrmRouteDriving, haversineKm } from "@/shared/services/osrm";
import { useAuth } from "@/shared/auth/AuthProvider";

import "leaflet/dist/leaflet.css";

// Fix icons
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

function loadSavedLocations() {
  try { return JSON.parse(localStorage.getItem("driver_saved_locs") || "[]"); } catch { return []; }
}
function saveLocation(pt) {
  if(!pt) return;
  const list = loadSavedLocations();
  // unikal qilish
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
  
  return (
    <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 12, marginBottom: 10, background: "#fff" }}>
      <div style={{ fontWeight: 800, marginBottom: 4, fontSize: 15 }}>{titleFrom} → {titleTo}</div>
      
      <div style={{ display: "flex", gap: 6, margin: "6px 0" }}>
        <Tag>{trip.vehicle_type}</Tag>
        {trip.has_ac && <Tag color="cyan">AC</Tag>}
        {trip.has_trunk && <Tag color="purple">Yukxona</Tag>}
      </div>

      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>
        📅 {trip.depart_date} {trip.depart_time ? `⏰ ${String(trip.depart_time).slice(0,5)}` : ""}
        <br/>
        💰 <b>{trip.price?.toLocaleString()} so'm</b> (1 o'rin) • {trip.seats} o'rin
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
  const { user } = useAuth();

  // Basic Info
  const [from, setFrom] = useState({ region: null, district: "" });
  const [to, setTo] = useState({ region: null, district: "" });
  const [travelDate, setTravelDate] = useState(null);
  const [travelTime, setTravelTime] = useState("");
  
  // Details
  const [seats, setSeats] = useState(4);
  const [price, setPrice] = useState(50000);
  const [vehicleType, setVehicleType] = useState("car"); // car, gazel, bus
  
  // Features
  const [womenOnly, setWomenOnly] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [isParcel, setIsParcel] = useState(false);
  const [hasAC, setHasAC] = useState(false);
  const [hasTrunk, setHasTrunk] = useState(false);
  
  const [note, setNote] = useState("");

  // Location logic
  const [departureMode, setDepartureMode] = useState("fixed"); // 'fixed' | 'address'
  const [pickupLL, setPickupLL] = useState(null);
  
  // Map visualization
  const fromLL = useMemo(() => (from.region ? getRegionCenter(from.region) : null), [from.region]);
  const toLL = useMemo(() => (to.region ? getRegionCenter(to.region) : null), [to.region]);
  
  const [routeCoords, setRouteCoords] = useState(null);
  const [routeDist, setRouteDist] = useState(0);

  useEffect(() => {
    // OSRM route calculation for driver preview
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

  const canCreate = Boolean(user?.id && from.region && to.region && travelDate && seats > 0 && price > 0);

  // Data state
  const [saving, setSaving] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  // Map Drawers
  const [mapDrawerOpen, setMapDrawerOpen] = useState(false); // For viewing route
  const [mapTrip, setMapTrip] = useState(null);
  
  const [pickerOpen, setPickerOpen] = useState(false); // For picking location
  const [savedLocs, setSavedLocs] = useState([]);

  useEffect(() => { setSavedLocs(loadSavedLocations()); }, []);

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
    setTravelTime("");
    setSeats(4);
    setPrice(50000);
    setVehicleType("car");
    setWomenOnly(false);
    setIsDelivery(false);
    setIsParcel(false);
    setHasAC(false);
    setHasTrunk(false);
    setNote("");
    setPickupLL(null);
    setDepartureMode("fixed");
  }, []);

  const startEdit = useCallback((trip) => {
    setEditingTrip(trip);
    setFrom({ region: trip.from_region, district: trip.from_district || "" });
    setTo({ region: trip.to_region, district: trip.to_district || "" });
    setTravelDate(trip.depart_date ? dayjs(trip.depart_date) : null);
    setTravelTime(trip.depart_time ? String(trip.depart_time).slice(0,5) : "");
    setSeats(trip.seats || 4);
    setPrice(trip.price || 0);
    setVehicleType(trip.vehicle_type || "car");
    setWomenOnly(Boolean(trip.women_only));
    setIsDelivery(Boolean(trip.is_delivery));
    setIsParcel(Boolean(trip.is_parcel));
    setHasAC(Boolean(trip.has_ac));
    setHasTrunk(Boolean(trip.has_trunk));
    setNote(trip.note || "");
    
    if (trip.pickup_lat && trip.pickup_lng) {
      setPickupLL([trip.pickup_lat, trip.pickup_lng]);
      setDepartureMode("address");
    } else {
      setPickupLL(null);
      setDepartureMode("fixed");
    }
  }, []);

  const createOrUpdate = useCallback(async () => {
    if (!user?.id) return;
    setSaving(true);
    
    const payload = {
      driver_user_id: user.id,
      from_region: from.region,
      from_district: from.district || null,
      to_region: to.region,
      to_district: to.district || null,
      depart_date: travelDate ? travelDate.format("YYYY-MM-DD") : null,
      depart_time: travelTime || null,
      seats: Number(seats),
      price: Number(price),
      vehicle_type: vehicleType,
      women_only: womenOnly,
      is_delivery: isDelivery,
      is_parcel: isParcel,
      has_ac: hasAC,
      has_trunk: hasTrunk,
      note: note || null,
      pickup_lat: departureMode === 'address' && pickupLL ? pickupLL[0] : null,
      pickup_lng: departureMode === 'address' && pickupLL ? pickupLL[1] : null,
    };

    try {
      if (editingTrip?.id) {
        const { error } = await supabase.from("interprov_trips").update(payload).eq("id", editingTrip.id);
        if (error) throw error;
        message.success("Yangilandi");
      } else {
        const { error } = await supabase.from("interprov_trips").insert(payload);
        if (error) throw error;
        message.success("Yaratildi");
      }
      setEditingTrip(null);
      resetForm();
      loadMyTrips();
    } catch (e) {
      console.error(e);
      message.error("Xatolik bo'ldi");
    } finally {
      setSaving(false);
    }
  }, [user, from, to, travelDate, travelTime, seats, price, vehicleType, womenOnly, isDelivery, isParcel, hasAC, hasTrunk, note, pickupLL, departureMode, editingTrip]);

  const deleteTrip = useCallback(async (trip) => {
    Modal.confirm({
      title: "O'chirishni tasdiqlaysizmi?",
      okText: "O'chirish", okButtonProps: { danger: true },
      onOk: async () => {
        const { error } = await supabase.from("interprov_trips").delete().eq("id", trip.id);
        if(!error) {
          message.success("O'chirildi");
          loadMyTrips();
        }
      }
    });
  }, [loadMyTrips]);

  const showRouteMap = (trip) => {
    // Show route for a specific trip in list
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

      {/* MAP PREVIEW (Create mode) */}
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
        
        {/* PICKUP LOCATION SELECTOR */}
        <div style={{ background: "#f0f5ff", padding: 10, borderRadius: 8, border: "1px dashed #1890ff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Jo'nab ketish joyi:</span>
            <Segmented 
              size="small"
              options={[
                { label: 'Belgilangan (Vokzal)', value: 'fixed' },
                { label: 'Manzildan', value: 'address' }
              ]}
              value={departureMode}
              onChange={setDepartureMode}
            />
          </div>
          {departureMode === 'address' && (
            <Button 
              icon={<EnvironmentOutlined />} 
              block 
              onClick={() => {
                if(!fromLL) { message.warning("Viloyatni tanlang"); return; }
                setPickupLL(pickupLL || fromLL);
                setPickerOpen(true);
              }}
            >
              {pickupLL ? "Manzil belgilandi (o'zgartirish)" : "Xaritadan manzilni tanlash"}
            </Button>
          )}
        </div>

        <RegionDistrictSelect label="Qayerga" region={to.region} district={to.district} onChange={setTo} allowEmptyDistrict />

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Sana</div>
            <DatePicker style={{ width: "100%" }} value={travelDate} onChange={setTravelDate} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Vaqt</div>
            <Input placeholder="08:30" value={travelTime} onChange={e => setTravelTime(e.target.value)} />
          </div>
        </div>

        <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #eee" }}>
          <div style={{ marginBottom: 10, fontWeight: 600 }}>Mashina va Narx</div>
          <Segmented block value={vehicleType} onChange={setVehicleType} options={[
            { label: 'Yengil', value: 'car' }, { label: 'Gazel', value: 'gazel' }, { label: 'Avtobus', value: 'bus' }
          ]} />
          
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12 }}>O'rinlar soni</div>
              <InputNumber style={{ width: "100%" }} min={1} max={50} value={seats} onChange={setSeats} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12 }}>Narx (1 o'rin)</div>
              <InputNumber 
                style={{ width: "100%" }} 
                min={0} step={1000} 
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                value={price} onChange={setPrice} 
              />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Checkbox checked={womenOnly} onChange={e => setWomenOnly(e.target.checked)}>Ayollar uchun</Checkbox>
          <Checkbox checked={isDelivery} onChange={e => setIsDelivery(e.target.checked)}>Pochta / Eltish</Checkbox>
          <Checkbox checked={hasAC} onChange={e => setHasAC(e.target.checked)}>Konditsioner</Checkbox>
          <Checkbox checked={hasTrunk} onChange={e => setHasTrunk(e.target.checked)}>Yukxona</Checkbox>
        </div>

        <Button type="primary" size="large" onClick={createOrUpdate} loading={saving} disabled={!canCreate}>
          {editingTrip ? "Saqlash" : "Reys yaratish"}
        </Button>
        {editingTrip && <Button onClick={() => { setEditingTrip(null); resetForm(); }}>Bekor qilish</Button>}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Mening reyslarim</h3>
        {loadingTrips ? <Spin /> : trips.map(t => (
          <TripRow key={t.id} trip={t} onEdit={startEdit} onDelete={deleteTrip} onShowMap={showRouteMap} />
        ))}
      </div>

      {/* MAP PICKER DRAWER */}
      <Drawer
        title="Manzilni belgilash"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        height="80vh"
        placement="bottom"
      >
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <MapContainer center={pickupLL || [41.31, 69.24]} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapPickerEvents onPick={(ll) => {
                setPickupLL(ll);
                saveLocation(ll);
                setSavedLocs(loadSavedLocations());
              }} />
              {pickupLL && <Marker position={pickupLL} />}
            </MapContainer>
          </div>
          <div style={{ padding: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Saqlanganlar:</div>
            <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 5 }}>
              {savedLocs.map((l, i) => (
                <Tag key={i} onClick={() => setPickupLL(l)}>Manzil {i+1}</Tag>
              ))}
            </div>
            <Button type="primary" block onClick={() => setPickerOpen(false)}>Tanlash</Button>
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