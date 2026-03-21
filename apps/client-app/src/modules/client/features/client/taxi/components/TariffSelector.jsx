import React from "react";
import { Segmented } from "antd";
import { calculationAssets } from "@/assets/calculation";

const tariffVisuals = {
  economy: calculationAssets.tariffs.economy,
  comfort: calculationAssets.tariffs.comfort,
  comfort_plus: calculationAssets.tariffs.comfortPlus,
  comfortplus: calculationAssets.tariffs.comfortPlus,
  business: calculationAssets.tariffs.business,
};

function resolveTariffVisual(option = {}) {
  const raw = String(option.id || option.value || option.key || option.name || option.label || "").toLowerCase();
  return tariffVisuals[raw] || null;
}

/** Tariff selector (UI). */
export default function TariffSelector({ options = [], value, onChange }) {
  const seg = options.map((t) => {
    const visual = resolveTariffVisual(t);
    const label = t.label || t.name;
    return {
      label: visual ? (
        <span className="flex items-center gap-2">
          <img src={visual} alt="" className="h-5 w-5 rounded-md object-cover" />
          <span>{label}</span>
        </span>
      ) : label,
      value: t.id || t.value,
    };
  });
  return <Segmented options={seg} value={value} onChange={onChange} block />;
}
