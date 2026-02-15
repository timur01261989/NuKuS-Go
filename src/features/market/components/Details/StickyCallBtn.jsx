
import React from "react";
import { Button } from "antd";
import { PhoneOutlined } from "@ant-design/icons";

export default function StickyCallBtn({ phone }) {
  if (!phone) return null;
  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 74, zIndex: 60,
      padding: 12
    }}>
      <Button
        type="primary"
        size="large"
        icon={<PhoneOutlined />}
        href={`tel:${phone}`}
        block
        style={{ borderRadius: 16, height: 50, boxShadow: "0 12px 34px rgba(22,119,255,0.28)" }}
      >
        Aloqa
      </Button>
    </div>
  );
}
