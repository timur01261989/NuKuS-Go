import React, { useEffect, useMemo, useState } from "react";
import { Card, Button, Typography, Space, Tag, Modal } from "antd";
import { getCategories, searchPoi } from "../../services/poiService.js";

const { Text } = Typography;

export function SearchOnRouteModule() {
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState(null);
  const [pos, setPos] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);

  useEffect(() => {
    getCategories().then((c) => {
      setCats(c || []);
      setCat(c?.[0]?.id || null);
    });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const current = useMemo(() => cats.find((c) => c.id === cat), [cats, cat]);

  async function runSearch() {
    if (!pos) {
      setOpenHelp(true);
      return;
    }
    setLoading(true);
    try {
      const res = await searchPoi({
        lat: pos.lat,
        lon: pos.lon,
        radius_m: 3000,
        categoryId: cat,
      });
      setItems(res || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <Card title="Yo‘lda qidirish" style={{ borderRadius: 16 }}>
        <Text type="secondary">
          GPS atrofidan servislarni topish (OSM level config)
        </Text>

        <div style={{ marginTop: 12 }}>
          <Space wrap>
            {cats.map((c) => (
              <Tag
                key={c.id}
                color={c.id === cat ? "blue" : "default"}
                style={{ cursor: "pointer", padding: "6px 10px", borderRadius: 999 }}
                onClick={() => setCat(c.id)}
              >
                {c.name_uz || c.name}
              </Tag>
            ))}
          </Space>
        </div>

        <div style={{ marginTop: 12 }}>
          <Text>
            Tanlangan: <b>{current?.name_uz || current?.name}</b>
          </Text>
          <Button type="link" onClick={() => setOpenHelp(true)} style={{ paddingLeft: 6 }}>
            ?
          </Button>
        </div>

        <div style={{ marginTop: 12 }}>
          <Space>
            <Button type="primary" onClick={runSearch} loading={loading}>
              Qidirish
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {pos ? `GPS: ${pos.lat.toFixed(5)}, ${pos.lon.toFixed(5)}` : "GPS yoqilmagan"}
            </Text>
          </Space>
        </div>

        <div style={{ marginTop: 16 }}>
          {!items.length && !loading ? (
            <Text type="secondary">Natija yo‘q. (Test uchun local POI ishlaydi)</Text>
          ) : null}

          <Space direction="vertical" style={{ width: "100%", marginTop: 8 }}>
            {items.map((it) => (
              <Card key={it.id} size="small" style={{ borderRadius: 14 }}>
                <div style={{ fontWeight: 700 }}>{it.name}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {it.distance_m ? `${Math.round(it.distance_m)} m` : ""}
                </div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {it.lat.toFixed(5)}, {it.lon.toFixed(5)}
                </div>
              </Card>
            ))}
          </Space>
        </div>
      </Card>

      <Modal
        open={openHelp}
        title="Qanday ishlaydi?"
        onCancel={() => setOpenHelp(false)}
        onOk={() => setOpenHelp(false)}
        okText="Tushunarli"
        cancelButtonProps={{ style: { display: "none" } }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <div>1) GPS yoqilgan bo‘lsa, ilova atrofingizdan POI qidiradi.</div>
          <div>2) Test rejimida <b>local sample POI</b> ishlaydi.</div>
          <div>
            3) Keyin xohlasangiz, <b>public/config/poi.json</b> da provider=overpass qilib online qidiruvni yoqasiz.
          </div>
        </div>
      </Modal>
    </div>
  );
}
