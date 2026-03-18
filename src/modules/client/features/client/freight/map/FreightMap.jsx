import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, message } from "antd";
import { AimOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { MapContainer, Marker, Polyline, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mapAssets } from "@/assets/map";

import { useFreightRoute } from "./useFreightRoute";
import { nominatimReverse } from "../services/freightApi";
import { useFreight } from "../context/FreightContext";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet marker icon fix
const pickupMarker = L.icon({ iconUrl: mapAssets.pickupPin || mapAssets.clientPinDay || mapAssets.pickupPointLive || mapAssets.pickupPoint || icon, shadowUrl: iconShadow, iconSize: [38, 46], iconAnchor: [19, 42] });
const dropoffMarker = L.icon({ iconUrl: mapAssets.finishPin || mapAssets.dropoffPin || mapAssets.deliveryPointLive || mapAssets.deliveryPoint || icon, shadowUrl: iconShadow, iconSize: [38, 46], iconAnchor: [19, 42] });
const userMarker = L.icon({ iconUrl: mapAssets.pickupPin || mapAssets.userPlacemark || mapAssets.userSelfLive || mapAssets.userSelf || icon, shadowUrl: iconShadow, iconSize: [34, 34], iconAnchor: [17, 17] });
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapClickPick({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function FreightMap() {
  const { pickup, setPickup, dropoff, setDropoff, selecting, setSelecting, setDistanceKm, setDurationMin } = useFreight();

  const [userLoc, setUserLoc] = useState(null);
  const mapRef = useRef(null);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  // Temporary draggable marker position while selecting (blue marker only)
  const [draft, setDraft] = useState(null);

  const { routeCoords, distanceKm, durationMin } = useFreightRoute(pickup?.latlng || null, dropoff?.latlng || null);

  useEffect(() => {
    if (distanceKm) setDistanceKm(distanceKm);
    if (durationMin) setDurationMin(durationMin);
  }, [distanceKm, durationMin, setDistanceKm, setDurationMin]);

  const defaultCenter = [42.46, 59.61]; // Nukus

  const baseCenter = useMemo(() => {
    if (pickup?.latlng) return pickup.latlng;
    if (userLoc) return userLoc;
    return defaultCenter;
  }, [pickup?.latlng, userLoc]);

  // Get user location once
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // When selecting starts, initialize draft marker and gently move map ONCE (no zoom "sakrash")
  useEffect(() => {
    if (!selecting) {
      setDraft(null);
      return;
    }
    const existing = selecting === "pickup" ? pickup?.latlng : dropoff?.latlng;
    const start = existing || userLoc || pickup?.latlng || defaultCenter;
    setDraft(start);

    // Move map once when opening selection
    const m = mapRef.current;
    if (m) {
      try {
        m.setView(start, Math.max(m.getZoom(), 16), { animate: true });
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecting]);

  const reverseToAddress = useCallback(
    async (latlng, which) => {
      if (!latlng) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
        abortRef.current = null;
      }

      debounceRef.current = setTimeout(async () => {
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        try {
          const addr = await nominatimReverse(latlng[0], latlng[1], ctrl.signal);
          if (ctrl.signal.aborted) return;

          if (which === "pickup") setPickup((prev) => ({ ...prev, latlng, address: addr || "" }));
          if (which === "dropoff") setDropoff((prev) => ({ ...prev, latlng, address: addr || "" }));
        } catch {
          // ignore
        }
      }, 220);
    },
    [setPickup, setDropoff]
  );

  const applyDraft = useCallback(() => {
    if (!selecting || !draft) return;
    reverseToAddress(draft, selecting);
  }, [selecting, draft, reverseToAddress]);

  const handleTapPicked = useCallback(
    (latlng) => {
      if (!selecting) return;
      setDraft(latlng);
      try {
        mapRef.current?.panTo(latlng);
      } catch {}
      reverseToAddress(latlng, selecting);
    },
    [selecting, reverseToAddress]
  );

  const handleLocateMe = () => {
    if (!navigator.geolocation) return message.error("Geolokatsiya yo‘q");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(p);
        if (selecting) {
          setDraft(p);
          mapRef.current?.setView(p, 16, { animate: true });
          reverseToAddress(p, selecting);
        } else {
          mapRef.current?.setView(p, 15, { animate: true });
        }
      },
      () => message.error("Joylashuvni aniqlab bo‘lmadi"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Fit bounds once when both points exist and we are NOT selecting
  const fittedRef = useRef(false);
  useEffect(() => {
    if (selecting) return;
    if (!pickup?.latlng || !dropoff?.latlng) {
      fittedRef.current = false;
      return;
    }
    if (fittedRef.current) return;
    const m = mapRef.current;
    if (!m) return;
    try {
      const b = L.latLngBounds([pickup.latlng, dropoff.latlng]);
      m.fitBounds(b.pad(0.25), { animate: true });
      fittedRef.current = true;
    } catch {}
  }, [selecting, pickup?.latlng, dropoff?.latlng]);

  const height = selecting ? "52vh" : 220;
  const center = selecting ? (draft || baseCenter) : baseCenter;

  return (
    <div style={{ position: "relative", height, borderRadius: 18, overflow: "hidden" }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(m) => (mapRef.current = m)}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        <MapClickPick enabled={!!selecting} onPick={handleTapPicked} />

        {/* Saved markers */}
        {userLoc && !selecting && <Marker position={userLoc} icon={userMarker} />}
        {pickup?.latlng && <Marker position={pickup.latlng} icon={pickupMarker} />}
        {dropoff?.latlng && <Marker position={dropoff.latlng} icon={dropoffMarker} />}

        {/* Selecting marker (blue, draggable). No yellow center marker. */}
        {selecting && draft && (
          <Marker
            position={draft}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = e.target.getLatLng();
                const next = [ll.lat, ll.lng];
                setDraft(next);
                reverseToAddress(next, selecting);
              },
            }}
          />
        )}

        {Array.isArray(routeCoords) && routeCoords.length >= 2 && (
          <Polyline positions={routeCoords} pathOptions={{ color: "#22c55e", weight: 6, opacity: 1 }} />
        )}
      </MapContainer>

      {/* locate button */}
      <div style={{ position: "absolute", right: 12, top: 12, zIndex: 800 }}>
        <Button shape="circle" size="large" icon={<AimOutlined />} onClick={handleLocateMe} />
      </div>

      {/* save/cancel panel when selecting */}
      {selecting && (
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, zIndex: 900, display: "flex", gap: 10 }}>
          <Button
            icon={<CloseOutlined />}
            onClick={() => setSelecting(null)}
            style={{ borderRadius: 14 }}
          >
            Bekor
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              applyDraft();
              setSelecting(null);
            }}
            style={{ flex: 1, borderRadius: 14 }}
          >
            Manzilni saqlash
          </Button>
        </div>
      )}
    </div>
  );
}
