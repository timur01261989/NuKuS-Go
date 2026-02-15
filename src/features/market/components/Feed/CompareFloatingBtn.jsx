
import React from "react";
import { Button } from "antd";
import { SwapOutlined } from "@ant-design/icons";

export default function CompareFloatingBtn({ count = 0, onClick }) {
  if (!count) return null;
  return (
    <Button
      type="primary"
      icon={<SwapOutlined />}
      onClick={onClick}
      style={{
        position: "fixed", right: 16, bottom: 90, zIndex: 60,
        borderRadius: 999, boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
      }}
    >
      Taqqoslash ({count})
    </Button>
  );
}
