import React, { useMemo } from "react";
import { Button, Space, Tag } from "antd";
import { BRANDS, MODELS_BY_BRAND } from "../../services/staticData";
import { useMarket } from "../../context/MarketContext";

/**
 * SmartFilterBar
 * Asl funksionallik to'liq saqlangan (marka, model, kredit, obmen).
 * YANGI: "Vikup bor" va "Barter bor" teg'lari qo'shildi
 */
export default function SmartFilterBar() {
  const { filters, patchFilters } = useMarket();

  const models = useMemo(() => MODELS_BY_BRAND[filters.brand] || [], [filters.brand]);

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
              flex: "0 0 auto"
            }}
          >
            {b.name}
          </Button>
        ))}
      </div>

      {filters.brand ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          {models.slice(0, 10).map((m) => (
            <Tag
              key={m}
              color={filters.model === m ? "blue" : "default"}
              style={{ cursor: "pointer", borderRadius: 999 }}
              onClick={() => patchFilters({ model: filters.model === m ? "" : m })}
            >
              {m}
            </Tag>
          ))}
          <Tag
            color={filters.kredit ? "purple" : "default"}
            style={{ cursor: "pointer", borderRadius: 999 }}
            onClick={() => patchFilters({ kredit: !filters.kredit })}
          >
            Kredit
          </Tag>
          <Tag
            color={filters.exchange ? "geekblue" : "default"}
            style={{ cursor: "pointer", borderRadius: 999 }}
            onClick={() => patchFilters({ exchange: !filters.exchange })}
          >
            Obmen
          </Tag>
          {/* YANGI */}
          <Tag
            color={filters.vikup ? "orange" : "default"}
            style={{ cursor: "pointer", borderRadius: 999 }}
            onClick={() => patchFilters({ vikup: !filters.vikup })}
          >
            💳 Vikup
          </Tag>
          <Tag
            color={filters.barter ? "success" : "default"}
            style={{ cursor: "pointer", borderRadius: 999 }}
            onClick={() => patchFilters({ barter: !filters.barter })}
          >
            🔄 Barter
          </Tag>
        </div>
      ) : null}
    </div>
  );
}
