import React from "react";
import { Select } from "antd";
import { TRUCKS } from "../../services/truckData";
import { useFreight } from "../../context/FreightContext";

export default function TruckSelector() {
  const { truckId, setTruckId, truck } = useFreight();

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <Select
        value={truckId}
        onChange={(v) => setTruckId(v)}
        size="large"
        style={{ width: "100%" }}
        optionLabelProp="label"
        options={TRUCKS.map((t) => ({
          value: t.id,
          label: `${t.title}`,
          title: `${t.title} — ${t.capacity}`,
        }))}
      />
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Tanlangan: <b>{truck?.title}</b> · {truck?.capacity}
      </div>
    </div>
  );
}
