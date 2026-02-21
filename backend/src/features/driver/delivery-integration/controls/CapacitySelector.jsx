import React from "react";
import { Segmented, Typography } from "antd";
import { ExpandOutlined } from "@ant-design/icons";

export default function CapacitySelector({ value = "M", onChange }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <ExpandOutlined style={{ color: "#666" }} />
        <Typography.Text strong>Yukxona sig'imi</Typography.Text>
      </div>
      <Segmented
        value={value}
        onChange={(v) => onChange?.(String(v))}
        options={[
          { label: "M", value: "M" },
          { label: "L", value: "L" },
          { label: "XL", value: "XL" },
        ]}
        block
      />
      <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
        M: kichik • L: o'rtacha • XL: katta
      </div>
    </div>
  );
}
