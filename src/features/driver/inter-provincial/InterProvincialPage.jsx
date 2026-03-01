import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Input, InputNumber, Switch, message, Modal, Drawer, Empty, Select, Checkbox, Radio, Tag } from "antd";
import dayjs from "dayjs";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";

import RegionDistrictSelect from "@/shared/components/RegionDistrictSelect";
import { UZ_REGIONS } from "@/shared/constants/uzRegions";
import { supabase } from "@/services/supabaseClient";
import { osrmRouteDriving, haversineKm } from "@/shared/services/osrm";
import { useAuth } from "@/shared/auth/AuthProvider";

import "leaflet/dist/leaflet.css";

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

// ✅ FIXED: haversineKm is now imported from @/shared/services/osrm
// ❌ REMOVED: Local haversineKm function definition (was here, now imported)

function ClickPicker({ onPick }) {
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
  const delDisabled = Boolean(trip.has_booking);

  return (
    <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 12, marginBottom: 10 }}>
      <div style={{ fontWeight: 800, marginBottom: 4 }}>{titleFrom} → {titleTo}</div>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
        {trip.depart_date}{trip.depart_time ? ` • ${String(trip.depart_time).slice(0,5)}` : ""} • {trip.seats} o'rin • {trip.price} so'm
        {trip.women_only ? " • Ayollar" : ""}
        {trip.is_delivery ? " • Eltish" : ""}
        {trip.is_parcel ? " • Posilka" : ""}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button onClick={() => onShowMap(trip)} block>Yo'l</Button>
        <Button onClick={() => onEdit(trip)} block>Tahrirlash</Button>
        <Button danger onClick={() => onDelete(trip)} disabled={delDisabled} block>
          O'chirish
        </Button>
      </div>
      {delDisabled ? <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>Buyurtma qabul qilingan: o'chirish blok.</div> : null}
    </div>
  );
}

export default function InterProvincialPage() {
  const { user } = useAuth();

  const [from, setFrom] = useState({ region: null, district: "" });
  const [to, setTo] = useState({ region: null, district: "" });

  const [travelDate, setTravelDate] = useState(null);
  const [travelTime, setTravelTime] = useState("");
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState(0);

  const [womenOnly, setWomenOnly] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [isParcel, setIsParcel] = useState(false);

  const [note, setNote] = useState("");

  const [pickupLL, setPickupLL] = useState(null);

  const fromLL = useMemo(() => (from.region ? getRegionCenter(from.region) : null), [from.region]);
  const toLL = useMemo(() => (to.region ? getRegionCenter(to.region) : null), [to.region]);

  const routeLine = useMemo(() => (fromLL && toLL ? [fromLL, toLL] : null), [fromLL, toLL]);
  // ✅ USES IMPORTED haversineKm (not local definition)
  const distanceKm = useMemo(() => (fromLL && toLL ? haversineKm(fromLL, toLL) : 0), [fromLL, toLL]);

  const canCreate = Boolean(user?.id && from.region && to.region && travelDate && seats > 0 && price >= 0);

  const [saving, setSaving] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  const [editingTrip, setEditingTrip] = useState(null);

  const [mapTrip, setMapTrip] = useState(null);
  const [mapDrawerOpen, setMapDrawerOpen] = useState(false);

  const loadMyTrips = useCallback(async () => {
    if (!user?.id) return;
    setLoadingTrips(true);
    try {
      const { data, error } = await supabase
        .from("interprov_trips")
        .select("*")
        .eq("driver_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setTrips(data || []);
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Reyslarni yuklashda xatolik");
    } finally {
      setLoadingTrips(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMyTrips();
  }, [loadMyTrips]);

  const resetForm = useCallback(() => {
    setFrom({ region: null, district: "" });
    setTo({ region: null, district: "" });
    setTravelDate(null);
    setTravelTime("");
    setSeats(3);
    setPrice(0);
    setWomenOnly(false);
    setIsDelivery(false);
    setIsParcel(false);
    setNote("");
    setPickupLL(null);
  }, []);

  const startEdit = useCallback((trip) => {
    setEditingTrip(trip);
    setFrom({ region: trip.from_region, district: trip.from_district || "" });
    setTo({ region: trip.to_region, district: trip.to_district || "" });
    setTravelDate(trip.depart_date ? dayjs(trip.depart_date) : null);
    setTravelTime(trip.depart_time ? String(trip.depart_time).slice(0,5) : "");
    setSeats(trip.seats || 1);
    setPrice(trip.price || 0);
    setWomenOnly(Boolean(trip.women_only));
    setIsDelivery(Boolean(trip.is_delivery));
    setIsParcel(Boolean(trip.is_parcel));
    setNote(trip.note || "");
    if (trip.pickup_lat && trip.pickup_lng) setPickupLL([trip.pickup_lat, trip.pickup_lng]);
    else setPickupLL(null);
  }, []);

  const createOrUpdate = useCallback(async () => {
    if (!user?.id) return;

    const payload = {
      driver_user_id: user.id,
      from_region: from.region,
      from_district: from.district || null,
      to_region: to.region,
      to_district: to.district || null,
      depart_date: travelDate ? travelDate.format("YYYY-MM-DD") : null,
      depart_time: travelTime || null,
      seats: Number(seats) || 1,
      price: Number(price) || 0,
      women_only: Boolean(womenOnly),
      is_delivery: Boolean(isDelivery),
      is_parcel: Boolean(isParcel),
      note: note || null,
      pickup_lat: pickupLL ? pickupLL[0] : null,
      pickup_lng: pickupLL ? pickupLL[1] : null,
    };

    if (!payload.depart_date) {
      message.error("Ketish sanasini tanlang");
      return;
    }

    setSaving(true);
    try {
      if (editingTrip?.id) {
        const { error } = await supabase.from("interprov_trips").update(payload).eq("id", editingTrip.id);
        if (error) throw error;
        message.success("Reys tahrirlandi");
      } else {
        const { error } = await supabase.from("interprov_trips").insert(payload);
        if (error) throw error;
        message.success("Reys yaratildi");
      }

      setEditingTrip(null);
      resetForm();
      await loadMyTrips();
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }, [user?.id, from, to, travelDate, travelTime, seats, price, womenOnly, isDelivery, isParcel, note, pickupLL, editingTrip, resetForm, loadMyTrips]);

  const deleteTrip = useCallback((trip) => {
    Modal.confirm({
      title: "Reysni o'chirasizmi?",
      content: "Agar buyurtma qabul qilingan bo'lsa, o'chirish blok bo'lishi kerak. Hozircha server tekshiruvi yo'q — ehtiyot bo'ling.",
      okText: "O'chirish",
      okButtonProps: { danger: true },
      cancelText: "Bekor",
      async onOk() {
        try {
          const { error } = await supabase.from("interprov_trips").delete().eq("id", trip.id).eq("driver_user_id", user.id);
          if (error) throw error;
          message.success("O'chirildi");
          await loadMyTrips();
        } catch (e) {
          console.error(e);
          message.error(e?.message || "O'chirishda xatolik");
        }
      },
    });
  }, [user?.id, loadMyTrips]);

  const openMap = useCallback((trip) => {
    setMapTrip(trip);
    setMapDrawerOpen(true);
  }, []);

  const mapFromLL = mapTrip ? getRegionCenter(mapTrip.from_region) : null;
  const mapToLL = mapTrip ? getRegionCenter(mapTrip.to_region) : null;
  const mapLine = mapFromLL && mapToLL ? [mapFromLL, mapToLL] : null;
  const mapPickup = mapTrip?.pickup_lat && mapTrip?.pickup_lng ? [mapTrip.pickup_lat, mapTrip.pickup_lng] : null;

  return (
    <div style={{ padding: 16, maxWidth: 920, margin: "0 auto" }}>
      <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>Haydovchi • Viloyatlar aro</div>

      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", marginBottom: 14 }}>
        <div style={{ height: 260 }}>
          <MapContainer
            center={pickupLL || fromLL || toLL || [41.2995, 69.2401]}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            <ClickPicker onPick={(ll) => setPickupLL(ll)} />
            {fromLL ? <Marker position={fromLL} /> : null}
            {toLL ? <Marker position={toLL} /> : null}
            {pickupLL ? <Marker position={pickupLL} /> : null}
            {routeLine ? <Polyline positions={routeLine} pathOptions={{ weight: 6, opacity: 0.85 }} /> : null}
          </MapContainer>
        </div>
        <div style={{ padding: 12, fontSize: 12, opacity: 0.85 }}>
          <div>Masofa (taxminiy): {fromLL && toLL ? Math.round(distanceKm) : "—"} km</div>
          <div style={{ marginTop: 6, opacity: 0.75 }}>
            Jo'nab ketish manzilini xaritadan belgilash: xaritani bosing (ixtiyoriy)
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Ketish sanasi</div>
            <DatePicker value={travelDate} onChange={(v) => setTravelDate(v)} style={{ width: "100%" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Ketish vaqti (HH:mm)</div>
            <Input value={travelTime} onChange={(e) => setTravelTime(e.target.value)} placeholder="Masalan: 08:30" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>O'rinlar</div>
            <InputNumber min={1} max={8} value={seats} onChange={(v) => setSeats(v)} style={{ width: "100%" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Narx (so'm)</div>
            <InputNumber min={0} value={price} onChange={(v) => setPrice(v)} style={{ width: "100%" }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 13 }}>Ayollar uchun rejim</div>
            <Switch checked={womenOnly} onChange={setWomenOnly} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 13 }}>Eltish xizmati</div>
            <Switch checked={isDelivery} onChange={setIsDelivery} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 13 }}>Posilka olib ketish</div>
            <Switch checked={isParcel} onChange={setIsParcel} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Izoh (ixtiyoriy)</div>
          <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Masalan: yo'lda 1 ta joy, posilka ham olaman..." />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Button type="primary" size="large" onClick={createOrUpdate} disabled={!canCreate} loading={saving} block>
            {editingTrip ? "Saqlash" : "Reys yaratish"}
          </Button>
          <Button size="large" onClick={() => { setEditingTrip(null); resetForm(); }} block>
            Tozalash
          </Button>
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Mening reyslarim</div>

      {loadingTrips ? (
        <div style={{ opacity: 0.8 }}>Yuklanmoqda...</div>
      ) : trips.length === 0 ? (
        <Empty description="Reys yo'q" />
      ) : (
        <div>
          {trips.map((t) => (
            <TripRow key={t.id} trip={t} onEdit={startEdit} onDelete={deleteTrip} onShowMap={openMap} />
          ))}
        </div>
      )}

      <Drawer
        title="Yo'l"
        open={mapDrawerOpen}
        onClose={() => setMapDrawerOpen(false)}
        height="78%"
        placement="bottom"
      >
        {!mapTrip ? null : (
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ height: 340 }}>
              <MapContainer center={mapFromLL || [41.2995, 69.2401]} zoom={7} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                {mapFromLL ? <Marker position={mapFromLL} /> : null}
                {mapToLL ? <Marker position={mapToLL} /> : null}
                {mapPickup ? <Marker position={mapPickup} /> : null}
                {mapLine ? <Polyline positions={mapLine} pathOptions={{ weight: 6, opacity: 0.9 }} /> : null}
              </MapContainer>
            </div>
            <div style={{ padding: 12, fontSize: 12, opacity: 0.85 }}>
              Masofa (taxminiy): {mapFromLL && mapToLL ? Math.round(haversineKm(mapFromLL, mapToLL)) : "—"} km
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
