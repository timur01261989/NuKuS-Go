import React, { useEffect, useState } from "react";
import { Button, Card, Modal, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { listMarketCars, formatPriceUZS, getMarketConfig } from "@services/marketService";
import { useLanguage } from "@shared/i18n/useLanguage";

// ✅ QO‘SHING (pathni kerak bo‘lsa moslang)
import { PostAdForm } from "../components/PostAdForm";

const { Title, Text } = Typography;

export default function AutoMarketPage() {
  const { t } = useLanguage();
  const [cfg, setCfg] = useState(null);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const c = await getMarketConfig();
        const list = await listMarketCars({ limit: 50 });
        if (mounted) {
          setCfg(c);
          setItems(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        console.error("AutoMarket load error:", e);
        if (mounted) {
          setCfg({ enabled: true, title: "Avto savdo" });
          setItems([]);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
          {cfg?.title || (t?.autoMarket || "Avto savdo")}
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ background: "#000", borderColor: "#000" }}
          onClick={() => setOpen(true)}
        >
          {t?.postAd || "E'lon berish"}
        </Button>
      </div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {items.map((c) => (
          <Card key={c.id} hoverable style={{ borderRadius: 16 }}>
            <div style={{ height: 120, borderRadius: 12, background: "#f0f0f0" }} />
            <div style={{ marginTop: 10, fontWeight: 900 }}>{c.title || c.model || "Mashina"}</div>
            <Space direction="vertical" size={0}>
              <Text type="secondary">{c.price ? formatPriceUZS(c.price) : ""}</Text>
              <Text type="secondary">
                {c.year ? `${c.year}` : ""}
                {c.km ? ` • ${c.km} km` : ""}
              </Text>
            </Space>
          </Card>
        ))}

        {!items.length ? (
          <Card style={{ borderRadius: 16 }}>
            <Text type="secondary">{t?.noAdsYet || "Hozircha e'lonlar yo‘q."}</Text>
          </Card>
        ) : null}
      </div>

      <Modal open={open} onCancel={() => setOpen(false)} footer={null} width={720} destroyOnClose>
        <Title level={4} style={{ marginTop: 0 }}>
          {t?.postAd || "E'lon berish"}
        </Title>

        <PostAdForm onDone={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
