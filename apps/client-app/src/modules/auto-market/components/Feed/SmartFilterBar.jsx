import React, { useMemo } from "react";
import { Button, Tag } from "antd";
import { BRANDS, MODELS_BY_BRAND } from "../../services/staticData";
import { buildBuyerQuickFilters } from "../../services/autoMarketBuyerCore";
import { useMarket } from "../../context/MarketContext";
import { useAutoMarketI18n } from "../../utils/useAutoMarketI18n";
import BodyTypeScroller from "./BodyTypeScroller";

export default function SmartFilterBar() {
  const { filters, patchFilters } = useMarket();
  const { am } = useAutoMarketI18n();
  const models = useMemo(() => MODELS_BY_BRAND[filters.brand] || [], [filters.brand]);
  const buyerQuickFilters = useMemo(() => buildBuyerQuickFilters(), []);

  const quickTags = [
    { key: "priceDropOnly", label: "Narxi tushgan", active: !!filters.priceDropOnly, patch: { priceDropOnly: !filters.priceDropOnly } },
    { key: "kredit", label: am("autoExtra.kredit"), active: !!filters.kredit, patch: { kredit: !filters.kredit } },
    { key: "exchange", label: am("autoExtra.exchange"), active: !!filters.exchange, patch: { exchange: !filters.exchange } },
    { key: "dealer", label: "Dilerlar", active: filters.sellerType === "dealer", patch: { sellerType: filters.sellerType === "dealer" ? "" : "dealer" } },
    { key: "batteryWarranty", label: "Batareya kafolati", active: !!filters.batteryWarranty, patch: { batteryWarranty: !filters.batteryWarranty } },
  ];

  return (
    <div style={{ padding: "10px 14px" }}>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
        {BRANDS.map((b) => (
          <Button
            key={b.id}
            size="small"
            onClick={() => patchFilters({ brand: filters.brand === b.name ? "" : b.name, model: "" })}
            style={{
              borderRadius: 999,
              border: "1px solid " + (filters.brand === b.name ? "#0ea5e9" : "#e2e8f0"),
              background: filters.brand === b.name ? "rgba(14,165,233,.12)" : "#fff",
              fontWeight: 800,
              color: "#0f172a",
              flex: "0 0 auto",
              height: 34,
            }}
          >
            {b.name}
          </Button>
        ))}
      </div>

      <BodyTypeScroller />

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 10 }}>
        {buyerQuickFilters.map((item) => (
          <Tag
            key={item.key}
            color="blue"
            style={{ cursor: "pointer", borderRadius: 999, paddingInline: 12, paddingBlock: 5, margin: 0 }}
            onClick={() => patchFilters(item.patch)}
          >
            {item.label}
          </Tag>
        ))}
      </div>

      {filters.brand ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {models.slice(0, 10).map((m) => (
            <Tag
              key={m}
              color={filters.model === m ? "blue" : "default"}
              style={{ cursor: "pointer", borderRadius: 999, paddingInline: 10 }}
              onClick={() => patchFilters({ model: filters.model === m ? "" : m })}
            >
              {m}
            </Tag>
          ))}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {quickTags.map((tag) => (
          <Tag
            key={tag.key}
            color={tag.active ? "geekblue" : "default"}
            style={{ cursor: "pointer", borderRadius: 999, paddingInline: 10, paddingBlock: 4 }}
            onClick={() => patchFilters(tag.patch)}
          >
            {tag.label}
          </Tag>
        ))}
      </div>
    </div>
  );
}