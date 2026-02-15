
import React from "react";
import { Segmented } from "antd";

export default function MyAdsTabs({ value, onChange }) {
  return (
    <div style={{ padding: 12 }}>
      <Segmented
        block
        value={value}
        onChange={onChange}
        options={[
          { label: "Aktiv", value: "active" },
          { label: "Arxiv", value: "archived" },
        ]}
      />
    </div>
  );
}
