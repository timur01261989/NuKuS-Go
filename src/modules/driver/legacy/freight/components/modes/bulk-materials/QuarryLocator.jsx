import React, { useMemo } from "react";
import { Card, Button, message } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

function ClickPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng);
    },
  });
  return null;
}

export default function QuarryLocator({ quarry, onChange, center = [42.46, 59.61] }) {
  const pos = useMemo(() => {
    if (quarry?.lat && quarry?.lng) return [quarry.lat, quarry.lng];
    return null;
  }, [quarry]);

  return (
    <Card size="small" style={{ borderRadius: 16 }} styles={{ body: { padding: 0, overflow: "hidden" } }}>
      <div style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800 }}>Karyer lokatsiyasi</div>
          <div style={{ fontSize: 12, color: "#666" }}>{pos ? `Tanlandi: ${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}` : "Xaritadan bosing"}</div>
        </div>
        <Button
          icon={<EnvironmentOutlined />}
          onClick={() => {
            message.info("Karyerni tanlash uchun xaritada bosing");
          }}
        >
          Tanlash
        </Button>
      </div>

      <div style={{ height: 240 }}>
        <MapContainer center={pos || center} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickPicker
            onPick={(ll) => {
              onChange?.({ lat: ll.lat, lng: ll.lng, address: "Karyer lokatsiya (demo)" });
            }}
          />
          {pos ? <Marker position={pos} /> : null}
        </MapContainer>
      </div>
    </Card>
  );
}
