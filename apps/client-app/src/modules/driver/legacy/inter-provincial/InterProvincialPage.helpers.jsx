import React from "react";
import { Button } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useMapEvents } from "react-leaflet";
import { UZ_REGIONS } from "@/modules/shared/constants/uzRegions";

export function getRegionCenter(regionName) {
  const r = UZ_REGIONS.find((x) => x.name === regionName);
  return r?.center || null;
}

// Manzil nomini aniqlash
export async function getAddressName(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz`);
    const data = await res.json();
    return data.display_name || "Belgilangan joy";
  } catch (e) {
    return "Noma'lum manzil";
  }
}

export function loadSavedLocations() {
  try { return JSON.parse(localStorage.getItem("driver_saved_locs") || "[]"); } catch { return []; }
}

export function saveLocation(pt) {
  if(!pt) return;
  const list = loadSavedLocations();
  const next = [pt, ...list].filter((v, i, a) => a.findIndex(t => (t[0] === v[0] && t[1] === v[1])) === i).slice(0, 6);
  localStorage.setItem("driver_saved_locs", JSON.stringify(next));
}

// --- Map Components ---

export function MapPickerEvents({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export function TripRow({ trip, onEdit, onDelete, onShowMap }) {
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button size="small" onClick={() => onShowMap(trip)} icon={<EnvironmentOutlined />}>Yo‘l</Button>
        <Button size="small" onClick={() => onEdit(trip)}>Tahrir</Button>
        <Button size="small" danger onClick={() => onDelete(trip)}>O‘chirish</Button>
      </div>
    </div>
  );
}

