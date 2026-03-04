import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useDistrict } from "../context/DistrictContext"; // 1. Context import qilindi

/**
 * DistrictMap.jsx (Client)
 * -------------------------------------------------------
 * - A (from) marker
 * - B (to) marker
 * - OSRM polyline (yo‘l bo‘ylab)
 *
 * QO'SHILGAN "YAGONA REYS" FUNKSIYALARI:
 * - Haydovchining GPS jonli lokatsiyasi (carIcon)
 * - Mijozni olish (PICKING_UP) vaqtida 100 metrlik Geo-zona (Circle)
 * - Haydovchi kelish vaqti (ETA) va Safar holatini ko'rsatuvchi ma'lumot paneli
 *
 * Eslatma: zoom "sakrab ketmasin" uchun doimiy qiymatlar ishlatiladi.
 */

const pinIcon = (color = "#1677ff") =>
  L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.25)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

// 2. Yangi: Haydovchi uchun taksi ikonkasi
const driverIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#faad14;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:14px;">🚕</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function DistrictMap({ from, to, polyline, distanceKm, durationMin }) {
  // 3. Contextdan jonli GPS va Statuslarni olamiz
  const { driverLocation, tripStatus, eta } = useDistrict();

  const center = useMemo(() => {
    if (from && to) return [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2];
    if (from) return [from.lat, from.lng];
    // Agar mijoz hali manzil kiritmagan bo'lsa, lekin haydovchi GPS lokatsiyasi bo'lsa markazga qo'yadi
    if (driverLocation) return [driverLocation.lat, driverLocation.lng]; 
    return [41.311, 69.2797]; // default (Toshkent)
  }, [from, to, driverLocation]);

  const zoom = useMemo(() => {
    if (from && to) return 9;
    return 11;
  }, [from, to]);

  return (
    // position: "relative" qilib qo'yildi, sababi ma'lumotlar panelini xarita ustiga chiqarish uchun
    <div style={{ height: 240, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(0,0,0,.08)", position: "relative" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        {from && <Marker position={[from.lat, from.lng]} icon={pinIcon("#1677ff")} />}
        {to && <Marker position={[to.lat, to.lng]} icon={pinIcon("#52c41a")} />}
        {polyline && polyline.length > 1 && <Polyline positions={polyline} pathOptions={{ color: "#1677ff", weight: 4 }} />}

        {/* 4. Yangi: Mijozni kutish hududi (100 metrlik Geo-zona). Haydovchi shu zonaga kirsa xabar ketadi */}
        {from && tripStatus === 'PICKING_UP' && (
          <Circle
            center={[from.lat, from.lng]}
            radius={100} // 100 metr atrofida
            pathOptions={{ color: '#1677ff', fillColor: '#1677ff', fillOpacity: 0.15, weight: 1, dashArray: "4 4" }}
          />
        )}

        {/* 5. Yangi: Haydovchining jonli GPS harakati. Xaritada mashina yurib borayotgani ko'rinadi */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon} />
        )}
      </MapContainer>

      {/* 6. Yangi: Safar holati va Haydovchining yetib kelish vaqti (ETA) ma'lumotlar paneli */}
      <div style={{ 
        position: "absolute", bottom: 0, left: 0, right: 0, 
        background: "rgba(255,255,255,0.95)", padding: "10px 12px", 
        fontSize: 12, color: "#555", borderTop: "1px solid rgba(0,0,0,.08)", zIndex: 400 
      }}>
        {!!distanceKm && (
          <div style={{ marginBottom: (tripStatus === 'PICKING_UP' || tripStatus === 'ON_TRIP') ? 4 : 0 }}>
            Masofa: <b>{distanceKm.toFixed(1)} km</b> · Vaqt: <b>{Math.max(1, Math.round(durationMin || 0))} daqiqa</b>
          </div>
        )}
        
        {/* Jonli Status xabarlari (Haydovchi kelishiga qancha qoldi) */}
        {tripStatus === 'PICKING_UP' && eta !== null && (
           <div style={{ color: "#fa8c16", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
             <span style={{ fontSize: 16 }}>🚕</span> Haydovchi kelmoqda: ~{eta} daqiqada yetib keladi
           </div>
        )}
        
        {/* Safar boshlanganidan keyingi xabar */}
        {tripStatus === 'ON_TRIP' && (
           <div style={{ color: "#52c41a", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
             <span style={{ fontSize: 16 }}>🛣️</span> Safardasiz. Oq yo'l!
           </div>
        )}
      </div>
    </div>
  );
}