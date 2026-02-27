import React from "react";
import { Segmented } from "antd";

/** Tariff selector (UI). */
export default function TariffSelector({ options = [], value, onChange }) {
  const seg = options.map((t) => ({ label: t.label || t.name, value: t.id || t.value }));
  return <Segmented options={seg} value={value} onChange={onChange} block />;
}
