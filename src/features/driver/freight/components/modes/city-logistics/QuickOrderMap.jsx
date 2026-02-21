import React from "react";
import { Card } from "antd";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

/**
 * QuickOrderMap - shahar ichidagi tez buyurtmalar xaritasi.
 * Eslatma: Sizning loyihada leaflet css global qo'shilgan bo'lishi kerak.
 */
export default function QuickOrderMap({ center = [42.46, 59.61], orders = [] }) {
  const points = Array.isArray(orders) ? orders : [];
  return (
    <Card size="small" style={{ borderRadius: 16 }} bodyStyle={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: 12, fontWeight: 800 }}>Tez buyurtmalar xaritasi</div>
      <div style={{ height: 260 }}>
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {points.map((o) => {
            const lat = o?.pickup?.lat ?? o?.from_lat;
            const lng = o?.pickup?.lng ?? o?.from_lng;
            if (typeof lat !== "number" || typeof lng !== "number") return null;
            return (
              <Marker key={o.id} position={[lat, lng]}>
                <Popup>
                  <div style={{ fontWeight: 700 }}>{o.title || "Yuk"}</div>
                  <div style={{ fontSize: 12 }}>{o.pickup?.address || o.from_address}</div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </Card>
  );
}
