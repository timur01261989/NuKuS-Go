import React, { useEffect } from "react";
import {
  Button,
  Modal,
  Typography,
} from "antd";
import {
  CarOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  InboxOutlined,
  ThunderboltOutlined,
  WomanOutlined,
} from "@ant-design/icons";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { mapAssets } from "@/assets/map";

import RegionDistrictSelect from "@/modules/shared/components/RegionDistrictSelect";
import { UZ_REGIONS } from "@/modules/shared/constants/uzRegions";

import "leaflet/dist/leaflet.css";

export const cp = (value) => String(value ?? "");
export const mapTile = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const intercityMapMarker = L.icon({
  iconUrl: mapAssets.finishPin || mapAssets.dropoffPin || mapAssets.routePoint,
  iconSize: [42, 52],
  iconAnchor: [21, 46],
});


export function getRegionCenter(regionName) {
  const r = UZ_REGIONS.find((x) => x.name === regionName);
  return r?.center || null;
}

export function loadSavedPickupPoints() {
  try {
    return JSON.parse(localStorage.getItem("saved_pickup_points") || "[]");
  } catch {
    return [];
  }
}

export function savePickupPoint(pt) {
  if (!pt) return;
  const pts = loadSavedPickupPoints();
  const newPts = [pt, ...pts]
    .filter((v, i, a) => a.findIndex((t) => t[0] === v[0] && t[1] === v[1]) === i)
    .slice(0, 5);
  localStorage.setItem("saved_pickup_points", JSON.stringify(newPts));
}

export async function getAddressName(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz`);
    const data = await res.json();
    return data.display_name || cp("Noma'lum manzil");
  } catch (e) {
    return cp("Manzilni aniqlab bo'lmadi");
  }
}

export function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const validPoints = (points || []).filter((p) => Array.isArray(p) && p.length === 2);
    if (validPoints.length === 0) return;
    if (validPoints.length === 1) {
      map.setView(validPoints[0], 9, { animate: true });
      return;
    }
    map.fitBounds(validPoints, { padding: [30, 30] });
  }, [map, points]);
  return null;
}

export function PickupPicker({ value, onChange, savedPoints }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <MapContainer center={value || [41.31, 69.24]} zoom={8} style={{ height: 300, borderRadius: 18 }}>
        <TileLayer url={mapTile} />
        <PickerEvents onPick={onChange} />
        {Array.isArray(value) && value.length === 2 ? <Marker position={value} icon={intercityMapMarker} /> : null}
      </MapContainer>

      {Array.isArray(savedPoints) && savedPoints.length ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {savedPoints.map((point, index) => (
            <Button key={`${point[0]}-${point[1]}-${index}`} onClick={() => onChange?.(point)}>
              {point[0].toFixed(3)}, {point[1].toFixed(3)}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PickerEvents({ onPick }) {
  useMapEvents({
    click(event) {
      onPick?.([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
}

export function SeatSelector({ trip, selectedSeats, onToggleSeat }) {
  const seats = Number(trip?.seats || 4);
  const busy = new Set(trip?.busySeats || []);
  const picked = new Set(selectedSeats || []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
      {Array.from({ length: seats }).map((_, index) => {
        const seatNumber = index + 1;
        const disabled = busy.has(seatNumber);
        const active = picked.has(seatNumber);
        return (
          <Button
            key={seatNumber}
            block
            disabled={disabled}
            type={active ? "primary" : "default"}
            icon={disabled ? <CheckCircleFilled /> : <CarOutlined />}
            onClick={() => onToggleSeat?.(seatNumber)}
          >
            {seatNumber}-o'rindiq
          </Button>
        );
      })}
    </div>
  );
}

export function TripCard({ trip, onViewMap, onSelect }) {
  const title = `${trip?.fromRegion || trip?.from || ""} → ${trip?.toRegion || trip?.to || ""}`.trim();
  return (
    <div
      style={{
        border: "1px solid #edf2ff",
        borderRadius: 20,
        padding: 16,
        background: "#fff",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary">
            {trip?.departureDate || trip?.date || cp("Sana ko'rsatilmagan")}
          </Typography.Text>
        </div>
        <div style={{ textAlign: "right" }}>
          <Typography.Text strong>{trip?.price || trip?.price_uzs || 0}</Typography.Text>
          <div>
            <Typography.Text type="secondary">{cp("UZS")}</Typography.Text>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button onClick={() => onViewMap?.(trip)} icon={<EnvironmentOutlined />} block>
          Yo'nalishni ko'rish
        </Button>
        <Button type="primary" onClick={() => onSelect?.(trip)} block>
          Tanlash
        </Button>
      </div>
    </div>
  );
}
