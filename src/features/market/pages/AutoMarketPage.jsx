import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Modal, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { listMarketCars, formatPriceUZS, getMarketConfig } from "../../../services/marketService.js";
import { useLanguage } from "../../../shared/i18n/useLanguage.js";
import PostAdForm from "@/components/PostAdForm.jsx";
const { Title, Text } = Typography;

// Raqamlarni “safe” olish uchun yordamchi
function pickNumber(...vals) {
  for (const v of vals) {
    const n = Number(v);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return 0;
}

export default function AutoMarketPage() {
  const { t } = useLanguage();
  const [cfg, setCfg] = useState(null);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal yopilganda ro‘yxatni yangilab berish uchun helper
  async function reload() {
    setLoading(true);
    try {
      const c = await getMarketConfig();
      const list = await listMarketCars({ limit: 50 });

      setCfg(c);
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("AutoMarket load error:", e);
      setCfg({ enabled: true, title: "Avto savdo" });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const c = await getMarketConfig();
        const list = await listMarketCars({ limit: 50 });

        if (!mounted) return;

        setCfg(c);
        setItems(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("AutoMarket load error:", e);
        if (!mounted) return;
        setCfg({ enabled: true, title: "Avto savdo" });
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const titleText = useMemo(() => {
    return cfg?.title || (t?.autoMarket || "Avto savdo");
  }, [cfg, t]);

  if (cfg && cfg.enabled === false) {
    return (
      <div style={{ padding: 14, maxWidth: 860, margin: "0 auto" }}>
        <Title level={3}>{t?.autoMarket || "Avto savdo"}</Title>
        <Text type="secondary">{t?.marketDisabled || "Avto savdo hozircha o‘chiq."}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 14, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}>
          {titleText}
        </Title>

        <Space>
          <Button onClick={reload} disabled={loading}>
            {loading ? (t?.loading || "Yuklanmoqda...") : (t?.refresh || "Yangilash")}
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: "#000", borderColor: "#000" }}
            onClick={() => setOpen(true)}
          >
            {t?.postAd || "E'lon berish"}
          </Button>
        </Space>
      </div>

      {loading ? (
        <div style={{ marginTop: 10 }}>
          <Text type="secondary">{t?.loading || "Yuklanmoqda..."}</Text>
        </div>
      ) : null}

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((c) => {
          const price = pickNumber(c.price, c.price_uzs, c.priceUZS);
          const km = pickNumber(c.km, c.mileage_km, c.mileageKm);
          const year = c.year ? String(c.year) : "";
          const img = c.image || c.cover || c.photo || "";

          return (
            <Card key={c.id} hoverable style={{ borderRadius: 16 }}>
              {img ? (
                <img
                  src={img}
                  alt="car"
                  style={{ height: 120, width: "100%", borderRadius: 12, objectFit: "cover", background: "#f0f0f0" }}
                />
              ) : (
                <div style={{ height: 120, borderRadius: 12, background: "#f0f0f0" }} />
              )}

              <div style={{ marginTop: 10, fontWeight: 900 }}>
                {c.title || c.model || "Mashina"}
              </div>

              <Space direction="vertical" size={0}>
                <Text type="secondary">{price ? formatPriceUZS(price) : ""}</Text>
                <Text type="secondary">
                  {year ? `${year}` : ""}
                  {km ? ` • ${km} km` : ""}
                </Text>
              </Space>
            </Card>
          );
        })}

        {!loading && !items.length ? (
          <Card style={{ borderRadius: 16 }}>
            <Text type="secondary">{t?.noAdsYet || "Hozircha e'lonlar yo‘q."}</Text>
          </Card>
        ) : null}
      </div>

      <Modal open={open} onCancel={() => setOpen(false)} footer={null} width={720} destroyOnClose>
        <Title level={4} style={{ marginTop: 0 }}>
          {t?.postAd || "E'lon berish"}
        </Title>

        <PostAdForm
          onDone={(listing) => {
            setOpen(false);

            // Agar listing qaytsa, UI darhol yangilansin (tezkor)
            if (listing && typeof listing === "object") {
              setItems((prev) => [listing, ...(Array.isArray(prev) ? prev : [])]);
            } else {
              // Aks holda ro‘yxatni qayta olib kelamiz
              reload();
            }
          }}
        />
      </Modal>
    </div>
  );
}//ss
