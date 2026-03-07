import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Carousel } from "antd";
import { listCars } from "../../services/marketBackend";
import PriceTag from "../Common/PriceTag";
import StatusBadge from "../Common/StatusBadge";
import { useAutoMarketI18n } from "../../utils/useAutoMarketI18n";

export default function StoriesRail() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const res = await listCars({ sort: "recent" }, { page: 1, pageSize: 24 });
      setItems(res.items.filter(x => x.is_top).slice(0, 8));
    })();
  }, []);

  if (!items.length) return null;

  return (
    <div style={{ padding: "12px 14px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>{am("stories.title")}</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>{am("stories.top")}</div>
      </div>

      <Carousel dots={false} slidesToShow={1} draggable>
        {items.map((ad) => (
          <div key={ad.id}>
            <div
              onClick={() => nav(`/auto-market/ad/${ad.id}`)}
              style={{
                position: "relative",
                height: 180,
                borderRadius: 18,
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "0 16px 40px rgba(2,6,23,.18)"
              }}
            >
              <img src={ad.images?.[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.65))" }} />
              <div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <StatusBadge type="TOP" />
                {ad.kredit ? <StatusBadge type="CREDIT" /> : null}
              </div>
              <div style={{ position: "absolute", left: 12, bottom: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ color: "#fff" }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>{ad.brand} {ad.model}</div>
                  <div style={{ fontSize: 12, opacity: .85 }}>{ad.year} • {ad.city}</div>
                </div>
                <PriceTag price={ad.price} currency={ad.currency} />
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
}
