import { useClientText } from "../shared/i18n_clientLocalize";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Empty, List, Spin, Typography } from "antd";
import { ArrowLeftOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { normalizeLatLng } from "./utils/latlng";

const { Title, Text } = Typography;

function formatDistance(m) {
  if (!Number.isFinite(m)) return "";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}
const pinIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function formatDuration(s) {
  if (!Number.isFinite(s)) return "";
  const min = Math.round(s / 60);
  if (min < 60) return `${min} daq`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return `${h} soat ${r} daq`;
}

export default function ClientNavigatorPage() {
  const nav = useNavigate();
  const loc = useLocation();

  const pickup = useMemo(() => normalizeLatLng(loc.state?.pickup), [loc.state]);
  const dest = useMemo(() => normalizeLatLng(loc.state?.dest), [loc.state]);
  const waypoints = useMemo(
    () => (loc.state?.waypoints || []).map((w) => normalizeLatLng(w)).filter(Boolean),
    [loc.state]
  );

  const [loading, setLoading] = useState(false);
  const [geo, setGeo] = useState(null);
  const [steps, setSteps] = useState([]);
  const [meta, setMeta] = useState({ distance: null, duration: null });
  const [error, setError] = useState(null);

  const mapCenter = pickup || dest || [42.4602, 59.6156];

  useEffect(() => {
    const pts = [pickup, ...waypoints, dest].filter(Boolean);
    if (pts.length < 2) return;

    const url =
      "https://router.project-osrm.org/route/v1/driving/" +
      pts.map((p) => `${p[1]},${p[0]}`).join(";") +
      "?overview=full&geometries=geojson&steps=true";

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data || data.code !== "Ok" || !data.routes?.[0]) {
          setError("Yo‘l topilmadi");
          setLoading(false);
          return;
        }
        const route = data.routes[0];
        setGeo(route.geometry);
        setMeta({ distance: route.distance, duration: route.duration });

        const allSteps = [];
        const legs = route.legs || [];
        legs.forEach((leg) => {
          (leg.steps || []).forEach((s) => {
            const name = (s.name || "").trim();
            const instruction = (s.maneuver?.instruction || "").trim();
            allSteps.push({
              key: `${allSteps.length}_${name}`,
              text: instruction || name || "Davom eting",
              name,
              distance: s.distance,
              duration: s.duration,
            });
          });
        });
        setSteps(allSteps);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Yo‘l topilmadi");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pickup, dest, waypoints]);

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#fff",
          borderBottom: "1px solid #eee",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={() => { if (window.history.length > 1) nav(-1); else nav("/taxi", { replace: true }); }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, lineHeight: 1.1 }}>Navigator</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {meta.distance ? formatDistance(meta.distance) : ""}{" "}
            {meta.duration ? `• ${formatDuration(meta.duration)}` : ""}
          </div>
        </div>
        <Button
          icon={<EnvironmentOutlined />}
          onClick={() => {
            if (!pickup || !dest) return;
            const url = `https://www.google.com/maps/dir/?api=1&origin=${pickup[0]},${pickup[1]}&destination=${dest[0]},${dest[1]}`;
            window.open(url, "_blank", "noopener,noreferrer");
          }}
        >
          Google Maps
        </Button>
      </div>

      {!pickup || !dest ? (
        <div style={{ padding: 16 }}>
          <Empty description="Manzillar topilmadi. Ortga qaytib, yo‘lni tanlang." />
        </div>
      ) : (
        <>
          <div style={{ height: "45vh" }}>
            <MapContainer center={mapCenter} zoom={14} style={{ width: "100%", height: "100%" }} zoomControl={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={pickup} icon={pinIcon} />
              {waypoints.map((w, i) => (
                <Marker key={i} position={w} icon={pinIcon} />
              ))}
              <Marker position={dest} icon={pinIcon} />
              {geo?.coordinates?.length ? (
                <Polyline
                  positions={geo.coordinates.map((c) => [c[1], c[0]])}
                  pathOptions={{ weight: 7, opacity: 0.95 }}
                />
              ) : null}
            </MapContainer>
          </div>

          <div style={{ padding: 12 }}>
            <Card style={{ borderRadius: 16 }}>
              <Title level={5} style={{ marginTop: 0 }}>
                Yo‘l ko‘rsatmalar
              </Title>

              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                  <Spin />
                </div>
              ) : error ? (
                <Text type="danger">{error}</Text>
              ) : (
                <List
                  size="small"
                  dataSource={steps}
                  renderItem={(s, idx) => (
                    <List.Item>
                      <div style={{ width: "100%" }}>
                        <div style={{ fontWeight: 700 }}>
                          {idx + 1}. {s.text}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {formatDistance(s.distance)} • {formatDuration(s.duration)}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
