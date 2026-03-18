import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Modal, Space, Tag, Typography } from "antd";
import { EnvironmentOutlined, LoadingOutlined, WarningOutlined } from "@ant-design/icons";
import { getCategories, searchPoi } from "@/modules/client/services/poiService.js";
import { useLanguage } from "@/modules/shared/i18n/useLanguage";

const { Text } = Typography;

const GEO_OPTS = { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 };
const SEARCH_RADIUS_M = 3000;
const DEBOUNCE_MS = 300;

/**
 * SearchOnRouteModule — yo'lda yaqin atrofdagi POI qidirish moduli.
 * Barcha buglar tuzatildi:
 *  - geolocation xatolari endi UI da ko'rsatiladi
 *  - import aliasga o'tkazildi
 *  - debounce va abort qo'shildi
 *  - React.memo + useCallback orqali ishlash optimallantirildi
 */
function SearchOnRouteModule() {
  const { tr } = useLanguage();

  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState(null);
  const [pos, setPos] = useState(null);
  const [geoError, setGeoError] = useState(null); // FIX: endi error yutilmaydi
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [openHelp, setOpenHelp] = useState(false);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  // Kategoriyalarni yuklash
  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((c) => {
        if (cancelled) return;
        const list = c || [];
        setCats(list);
        if (list.length) setCat(list[0].id);
      })
      .catch((err) => {
        if (!cancelled) setSearchError(String(err?.message || err));
      });
    return () => { cancelled = true; };
  }, []);

  // GPS kuzatuv — xatolar endi UI ga chiqariladi
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError(tr("searchOnRoute.geoNotSupported", "GPS qurilmada qo'llab-quvvatlanmaydi."));
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lon: p.coords.longitude });
        setGeoError(null); // FIX: muvaffaqiyatli positsionda xatoni tozala
      },
      (err) => {
        // FIX: avval bu () => {} edi — xatolar butunlay yutilardi
        const msg = err?.code === 1
          ? tr("searchOnRoute.geoPermDenied", "GPS ruxsati rad etildi. Brauzer sozlamalarini tekshiring.")
          : err?.code === 2
            ? tr("searchOnRoute.geoUnavailable", "GPS signal topilmadi.")
            : tr("searchOnRoute.geoTimeout", "GPS so'rovi vaqt tugadi.");
        setGeoError(msg);
      },
      GEO_OPTS,
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [tr]);

  const currentCat = useMemo(() => cats.find((c) => c.id === cat), [cats, cat]);

  // Debounce + abort orqali qidiruv
  const runSearch = useCallback(() => {
    if (!pos) { setOpenHelp(true); return; }

    // Oldingi in-flight requestni bekor qil
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearchError(null);
      try {
        const res = await searchPoi({
          lat: pos.lat,
          lon: pos.lon,
          radius_m: SEARCH_RADIUS_M,
          categoryId: cat,
          signal: abortRef.current?.signal,
        });
        setItems(res || []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setSearchError(String(err?.message || err));
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }, [pos, cat]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  }, []);

  const handleCatClick = useCallback((id) => setCat(id), []);
  const handleCloseHelp = useCallback(() => setOpenHelp(false), []);

  return (
    <div style={{ padding: 12 }}>
      <Card
        title={tr("searchOnRoute.title", "Yo'lda qidirish")}
        style={{ borderRadius: 16 }}
      >
        <Text type="secondary">
          {tr("searchOnRoute.subtitle", "GPS atrofidan servislarni topish")}
        </Text>

        {/* GPS holati */}
        {geoError && (
          <div style={{
            marginTop: 10, padding: "8px 12px", background: "#fff7e6",
            borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
          }}>
            <WarningOutlined style={{ color: "#fa8c16" }} />
            <Text type="warning" style={{ fontSize: 12 }}>{geoError}</Text>
          </div>
        )}

        {/* Kategoriya teglari */}
        <div style={{ marginTop: 12 }}>
          <Space wrap>
            {cats.map((c) => (
              <Tag
                key={c.id}
                color={c.id === cat ? "blue" : "default"}
                style={{ cursor: "pointer", padding: "6px 10px", borderRadius: 999 }}
                onClick={() => handleCatClick(c.id)}
              >
                {c.name_uz || c.name_ru || c.name_en || c.name}
              </Tag>
            ))}
          </Space>
        </div>

        {/* Tanlangan kategoriya */}
        <div style={{ marginTop: 12 }}>
          <Text>
            {tr("searchOnRoute.selected", "Tanlangan")}:{" "}
            <b>{currentCat?.name_uz || currentCat?.name_ru || currentCat?.name_en || currentCat?.name}</b>
          </Text>
          <Button type="link" onClick={() => setOpenHelp(true)} style={{ paddingLeft: 6 }}>?</Button>
        </div>

        {/* Qidiruv tugmasi */}
        <div style={{ marginTop: 12 }}>
          <Space>
            <Button type="primary" onClick={runSearch} loading={loading} icon={<EnvironmentOutlined />}>
              {tr("searchOnRoute.search", "Qidirish")}
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {pos
                ? `GPS: ${pos.lat.toFixed(5)}, ${pos.lon.toFixed(5)}`
                : tr("searchOnRoute.gpsOff", "GPS kutilmoqda...")}
            </Text>
          </Space>
        </div>

        {/* Xato xabari */}
        {searchError && (
          <div style={{ marginTop: 8 }}>
            <Text type="danger" style={{ fontSize: 12 }}>{searchError}</Text>
          </div>
        )}

        {/* Natijalar */}
        <div style={{ marginTop: 16 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 16 }}>
              <LoadingOutlined style={{ fontSize: 24 }} />
            </div>
          )}
          {!items.length && !loading ? (
            <Text type="secondary">
              {tr("searchOnRoute.noResults", "Natija yo'q. Qidiruvni boshlang.")}
            </Text>
          ) : null}
          <Space direction="vertical" style={{ width: "100%", marginTop: 8 }}>
            {items.map((it) => (
              <Card key={it.id} size="small" style={{ borderRadius: 14 }}>
                <div style={{ fontWeight: 700 }}>{it.name}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {it.distance_m ? `${Math.round(it.distance_m)} m` : ""}
                </div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {it.lat?.toFixed(5)}, {it.lon?.toFixed(5)}
                </div>
              </Card>
            ))}
          </Space>
        </div>
      </Card>

      {/* Yordam modali */}
      <Modal
        open={openHelp}
        title={tr("searchOnRoute.howItWorks", "Qanday ishlaydi?")}
        onCancel={handleCloseHelp}
        onOk={handleCloseHelp}
        okText={tr("common.gotIt", "Tushunarli")}
        cancelButtonProps={{ style: { display: "none" } }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <div>{tr("searchOnRoute.help1", "1) GPS yoqilgan bo'lsa, ilova atrofingizdan POI qidiradi.")}</div>
          <div>
            {tr("searchOnRoute.help2a", "2) Test rejimida")}{" "}
            <b>local sample POI</b>{" "}
            {tr("searchOnRoute.help2b", "ishlaydi.")}
          </div>
          <div>
            {tr("searchOnRoute.help3a", "3) Keyin xohlasangiz,")}{" "}
            <b>public/config/poi.json</b>{" "}
            {tr("searchOnRoute.help3b", "da provider=overpass qilib online qidiruvni yoqasiz.")}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export { SearchOnRouteModule };
export default React.memo(SearchOnRouteModule);
