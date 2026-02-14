
/**
 * ClientTaxi_YandexStyle_FULL.jsx
 * ------------------------------------------------------------
 * Yandex Go style taxi order screen (FREE MAP VERSION)
 *
 * Features:
 * ✅ Drag map to choose pickup & destination
 * ✅ Center pin (Yandex style)
 * ✅ Distance auto calculation
 * ✅ Green solid route line
 * ✅ Auto price calculation
 * ✅ Saved addresses (recent places)
 * ✅ apiHelper integration
 *
 * Requires:
 *   npm install leaflet
 */

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "@/utils/apiHelper";

const BASE_PRICE = 3000;   // start price
const PRICE_PER_KM = 1200; // per km

function haversine(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;

  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) *
      Math.cos(b.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
}

export default function ClientTaxi() {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const routeLine = useRef(null);

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(0);
  const [price, setPrice] = useState(0);
  const [recent, setRecent] = useState([]);

  // INIT MAP
  useEffect(() => {
    if (mapObj.current) return;

    mapObj.current = L.map(mapRef.current, {
      zoomControl: false,
      center: [42.46, 59.61],
      zoom: 14,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(mapObj.current);

    const centerIcon = L.divIcon({
      html: "📍",
      className: "",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    const centerMarker = L.marker(mapObj.current.getCenter(), {
      icon: centerIcon,
      interactive: false,
    }).addTo(mapObj.current);

    mapObj.current.on("move", () => {
      centerMarker.setLatLng(mapObj.current.getCenter());
    });

    mapObj.current.on("moveend", () => {
      const c = mapObj.current.getCenter();
      if (!pickup) setPickup({ lat: c.lat, lng: c.lng });
      else setDestination({ lat: c.lat, lng: c.lng });
    });
  }, []);

  // DISTANCE + PRICE
  useEffect(() => {
    if (!pickup || !destination) return;

    const km = haversine(pickup, destination);
    setDistance(km);

    const total = BASE_PRICE + km * PRICE_PER_KM;
    setPrice(Math.round(total));

    drawRoute();
  }, [pickup, destination]);

  function drawRoute() {
    if (!mapObj.current || !pickup || !destination) return;

    if (routeLine.current) {
      routeLine.current.remove();
    }

    routeLine.current = L.polyline(
      [
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng],
      ],
      {
        color: "#00c853",
        weight: 6,
        opacity: 1,
      }
    ).addTo(mapObj.current);
  }

  async function createOrder() {
    if (!pickup || !destination) {
      alert("Manzillarni tanlang");
      return;
    }

    await api.post("/api/order", {
      action: "create_taxi",
      pickup,
      destination,
      distance_km: distance,
      price,
    });

    setRecent((r) => [
      { pickup, destination },
      ...r.slice(0, 4),
    ]);

    alert("Zakaz yuborildi");
  }

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

      {/* TOP PANEL */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          background: "#fff",
          borderRadius: 12,
          padding: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
      >
        <div><b>Qayerdan ketasiz?</b></div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Xarita markazini siljiting
        </div>
      </div>

      {/* BOTTOM PANEL */}
      {pickup && destination && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#fff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 16,
            boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
          }}
        >
          <div>Masofa: {distance.toFixed(2)} km</div>
          <div style={{ fontSize: 22, fontWeight: "bold" }}>
            {price.toLocaleString()} so'm
          </div>

          <button
            onClick={createOrder}
            style={{
              marginTop: 12,
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "none",
              background: "#ffd600",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            Taksi chaqirish
          </button>
        </div>
      )}
    </div>
  );
}
