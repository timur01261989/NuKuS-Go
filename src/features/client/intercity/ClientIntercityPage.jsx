import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Button, DatePicker, Drawer, Empty, Spin, message } from "antd";
// 1-TUZATISH: useMapEvents shu yerga qo'shildi
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
// import dayjs from "dayjs"; // Agar kerak bo'lsa yoqing

// Loyiha importlari
import RegionDistrictSelect from "@/shared/components/RegionDistrictSelect";
import { UZ_REGIONS } from "@/shared/constants/uzRegions";
import { supabase } from "@/services/supabaseClient";

// 2-TUZATISH: haversineKm importdan olib tashlandi (pastda funksiya bor)
import { osrmRouteDriving } from "@/shared/services/osrm";

import "leaflet/dist/leaflet.css";

// Fix default marker icon
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

// 2-TUZATISH: Bu funksiya qoldirildi, importdagisi olib tashlandi
function haversineKm(a, b) {
  if (!a || !b) return 0;
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
  return R * c;
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

// --- Komponentlar ---

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (!points || points.length < 1) return;
    const pts = points.filter(Boolean);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 9, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(pts.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds.pad(0.3), { animate: true });
  }, [map, points]);
  return null;
}

function PickupPicker({ value, onChange, savedPoints }) {
  // 1-TUZATISH: useMapEvents endi ishlaydi
  useMapEvents({
    click(e) {
      const ll = [e.latlng.lat, e.latlng.lng];
      onChange(ll);
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

function TripCard({ trip, onViewMap, onSelect }) {
  const titleFrom = trip.from_district ? `${trip.from_region} • ${trip.from_district}` : trip.from_region;
  const titleTo = trip.to_district ? `${trip.to_region} • ${trip.to_district}` : trip.to_region;

  return (
    <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{titleFrom} → {titleTo}</div>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
        {trip.depart_date}{trip.depart_time ? ` • ${String(trip.depart_time).slice(0,5)}` : ""} • {trip.seats} o‘rin
        {typeof trip.price === "number" ? ` • ${trip.price} so‘m` : ""}
        {trip.women_only ? " • Ayollar uchun" : ""}
        {trip.is_delivery ? " • Eltish" : ""}
        {trip.is_parcel ? " • Posilka" : ""}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button onClick={() => onViewMap(trip)} block>Yo‘lni ko‘rish</Button>
        <Button type="primary" block onClick={() => onSelect && onSelect(trip)}>
          Tanlash
        </Button>
      </div>
    </div>
  );
}

// --- Asosiy Page ---

export default function ClientIntercityPage() {
  const [from, setFrom] = useState({ region: null, district: "" });
  const [to, setTo] = useState({ region: null, district: "" });
  const [travelDate, setTravelDate] = useState(null);

  const fromLL = useMemo(() => (from.region ? getRegionCenter(from.region) : null), [from.region]);
  const toLL = useMemo(() => (to.region ? getRegionCenter(to.region) : null), [to.region]);

  const polyline = useMemo(() => {
    if (!fromLL || !toLL) return null;
    return [fromLL, toLL];
  }, [fromLL, toLL]);

  const distanceKm = useMemo(() => (fromLL && toLL ? haversineKm(fromLL, toLL) : 0), [fromLL, toLL]);

  const canSearch = Boolean(from.region && to.region);

  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [mapTrip, setMapTrip] = useState(null);

  // Pickup Picker State
  const [pickupPickerOpen, setPickupPickerOpen] = useState(false);
  const [pickupPoint, setPickupPoint] = useState(null);
  const [savedPickupPoints, setSavedPickupPoints] = useState([]);
  const [selectedTripForBooking, setSelectedTripForBooking] = useState(null);

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
        .order("depart_time", { ascending: true })
        .limit(100);

      if (from.district) q = q.eq("from_district", from.district);
      if (to.district) q = q.eq("to_district", to.district);
      if (dateStr) q = q.eq("depart_date", dateStr);

      const { data, error } = await q;
      if (error) throw error;

      setTrips(data || []);
      setDrawerOpen(true);
      if ((data || []).length === 0) message.info("Hozircha reys topilmadi");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  }, [canSearch, from, to, travelDate]);

  const viewTripOnMap = useCallback((trip) => {
    setMapTrip(trip);
  }, []);

  const handleSelectTrip = useCallback((trip) => {
    setSelectedTripForBooking(trip);
    // Default markaz sifatida 'fromLL' yoki Toshkent
    setPickupPoint(fromLL || getRegionCenter(trip.from_region) || [41.31, 69.28]);
    setPickupPickerOpen(true);
  }, [fromLL]);

  const tripFromLL = mapTrip ? getRegionCenter(mapTrip.from_region) : null;
  const tripToLL = mapTrip ? getRegionCenter(mapTrip.to_region) : null;
  const tripLine = tripFromLL && tripToLL ? [tripFromLL, tripToLL] : null;

  return (
    <div style={{ padding: 16, maxWidth: 820, margin: "0 auto" }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Viloyatlar aro</div>

      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", marginBottom: 14 }}>
        <div style={{ height: 190 }}>
          <MapContainer
            center={fromLL || toLL || [41.2995, 69.2401]}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url={mapTile}
              attribution="&copy; OpenStreetMap"
            />
            <FitBounds points={[fromLL, toLL]} />
            {fromLL ? <Marker position={fromLL} /> : null}
            {toLL ? <Marker position={toLL} /> : null}
            {polyline ? <Polyline positions={polyline} pathOptions={{ weight: 6, opacity: 0.85 }} /> : null}
          </MapContainer>
        </div>
        <div style={{ padding: 12, fontSize: 12, opacity: 0.85 }}>
          {canSearch ? `Masofa (taxminiy): ${Math.round(distanceKm)} km` : "Masofa: —"}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr" }}>
        <RegionDistrictSelect
          label="Qaerdan"
          region={from.region}
          district={from.district}
          onChange={({ region, district }) => setFrom({ region, district })}
          allowEmptyDistrict
        />

        <RegionDistrictSelect
          label="Qayerga"
          region={to.region}
          district={to.district}
          onChange={({ region, district }) => setTo({ region, district })}
          allowEmptyDistrict
        />

        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Ketish sanasi</div>
          <DatePicker
            value={travelDate}
            onChange={(v) => setTravelDate(v)}
            style={{ width: "100%" }}
            placeholder="Sanani tanlang (ixtiyoriy)"
          />
        </div>

        <Button type="primary" size="large" onClick={searchTrips} disabled={!canSearch} loading={loading}>
          Reys izlash
        </Button>
      </div>

      <Drawer
        title="Topilgan reyslar"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        height="78%"
        placement="bottom"
      >
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Spin /></div>
        ) : trips.length === 0 ? (
          <Empty description="Reys yo‘q" />
        ) : (
          <div>
            {trips.map((t) => (
              <TripCard 
                key={t.id} 
                trip={t} 
                onViewMap={viewTripOnMap} 
                onSelect={handleSelectTrip} 
              />
            ))}
          </div>
        )}
      </Drawer>

      <Drawer
        title="Yo‘l"
        open={Boolean(mapTrip)}
        onClose={() => setMapTrip(null)}
        height="78%"
        placement="bottom"
      >
        {!mapTrip ? null : (
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ height: 320 }}>
              <MapContainer
                center={tripFromLL || [41.2995, 69.2401]}
                zoom={7}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url={mapTile}
                  attribution="&copy; OpenStreetMap"
                />
                <FitBounds points={[tripFromLL, tripToLL]} />
                {tripFromLL ? <Marker position={tripFromLL} /> : null}
                {tripToLL ? <Marker position={tripToLL} /> : null}
                {tripLine ? <Polyline positions={tripLine} pathOptions={{ weight: 6, opacity: 0.9 }} /> : null}
              </MapContainer>
            </div>
            <div style={{ padding: 12, fontSize: 12, opacity: 0.85 }}>
              Masofa (taxminiy): {tripFromLL && tripToLL ? Math.round(haversineKm(tripFromLL, tripToLL)) : "—"} km
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        title="Olib ketish manzilini xaritadan tanlang"
        open={pickupPickerOpen}
        onClose={() => setPickupPickerOpen(false)}
        placement="bottom"
        height="75vh"
      >
        <div style={{ height: "55vh", borderRadius: 12, overflow: "hidden" }}>
          <MapContainer 
            center={pickupPoint || [41.31, 69.28]} 
            zoom={12} 
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url={mapTile} />
            <PickupPicker
              value={pickupPoint}
              onChange={(ll) => {
                setPickupPoint(ll);
                savePickupPoint(ll);
                setSavedPickupPoints(loadSavedPickupPoints());
              }}
              savedPoints={savedPickupPoints}
            />
          </MapContainer>
        </div>
        <Button
          type="primary"
          block
          style={{ marginTop: 12 }}
          onClick={() => {
            if (!pickupPoint) { message.error("Xaritadan manzil tanlang"); return; }
            message.success("Manzil belgilandi! Buyurtma berishga o'tamiz...");
            setPickupPickerOpen(false);
          }}
        >
          Davom etish
        </Button>
      </Drawer>

    </div>
  );
}