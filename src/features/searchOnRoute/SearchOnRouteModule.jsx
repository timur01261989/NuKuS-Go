import React, { useEffect, useMemo, useState } from "react";
import { Card, Button, Typography, Space, Tag, Modal } from "antd";
import { getCategories, searchPoi } from "../../services/poiService.js";
import { useLanguage } from "@/shared/i18n/useLanguage";

const { Text } = Typography;

export function SearchOnRouteModule() {
  const { tr } = useLanguage();
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
      <Card title={tr("searchOnRoute.title", "Yo‘lda qidirish")} style={{ borderRadius: 16 }}>
        <Text type="secondary">
          {tr("searchOnRoute.subtitle", "GPS atrofidan servislarni topish (OSM level config)")}
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
                {c.name_uz || c.name_ru || c.name_en || c.name}
              </Tag>
            ))}
          </Space>
        </div>

        <div style={{ marginTop: 12 }}>
          <Text>
            {tr("searchOnRoute.selected", "Tanlangan")}: <b>{current?.name_uz || current?.name_ru || current?.name_en || current?.name}</b>
          </Text>
          <Button type="link" onClick={() => setOpenHelp(true)} style={{ paddingLeft: 6 }}>
            ?
          </Button>
        </div>

        <div style={{ marginTop: 12 }}>
          <Space>
            <Button type="primary" onClick={runSearch} loading={loading}>
              {tr("searchOnRoute.search", "Qidirish")}
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {pos ? `GPS: ${pos.lat.toFixed(5)}, ${pos.lon.toFixed(5)}` : tr("searchOnRoute.gpsOff", "GPS yoqilmagan")}
            </Text>
          </Space>
        </div>

        <div style={{ marginTop: 16 }}>
          {!items.length && !loading ? (
            <Text type="secondary">{tr("searchOnRoute.noResults", "Natija yo‘q. (Test uchun local POI ishlaydi)")}</Text>
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
        title={tr("searchOnRoute.howItWorks", "Qanday ishlaydi?")}
        onCancel={() => setOpenHelp(false)}
        onOk={() => setOpenHelp(false)}
        okText={tr("common.gotIt", "Tushunarli")}
        cancelButtonProps={{ style: { display: "none" } }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <div>{tr("searchOnRoute.help1", "1) GPS yoqilgan bo‘lsa, ilova atrofingizdan POI qidiradi.")}</div>
          <div>{tr("searchOnRoute.help2a", "2) Test rejimida")} <b>local sample POI</b> {tr("searchOnRoute.help2b", "ishlaydi.")}</div>
          <div>
            {tr("searchOnRoute.help3a", "3) Keyin xohlasangiz,")} <b>public/config/poi.json</b> {tr("searchOnRoute.help3b", "da provider=overpass qilib online qidiruvni yoqasiz.")}
          </div>
        </div>
      </Modal>
    </div>
  );
}
