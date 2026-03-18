import React from "react";
import { Button } from "antd";
import { curatedBodyTypeOptions } from "../../services/autoMarketExperience";
import { useMarket } from "../../context/MarketContext";

export default function BodyTypeScroller() {
  const { filters, patchFilters } = useMarket();

  return (
    <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, marginTop: 12 }}>
      {curatedBodyTypeOptions.map((option) => {
        const active = filters.bodyType === option.filterValue || (option.filterValue === "Elektro" && filters.fuel_type === "Elektro") || (option.filterValue === "Gibrid" && filters.fuel_type === "Gibrid");
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => {
              if (option.filterValue === "Elektro" || option.filterValue === "Gibrid") {
                patchFilters({ fuel_type: active ? "" : option.filterValue });
                return;
              }
              patchFilters({ bodyType: active ? "" : option.filterValue });
            }}
            style={{
              minWidth: 92,
              borderRadius: 18,
              border: `1px solid ${active ? "#0ea5e9" : "#e2e8f0"}`,
              background: active ? "rgba(14,165,233,.1)" : "#fff",
              padding: 10,
              display: "grid",
              gap: 8,
              placeItems: "center",
              cursor: "pointer",
              boxShadow: active ? "0 10px 24px rgba(14,165,233,.12)" : "none",
              flex: "0 0 auto",
            }}
          >
            <img src={option.asset} alt={option.label} style={{ width: 42, height: 28, objectFit: "contain" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", textAlign: "center" }}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}