import React from "react";
import { Button, Badge } from "antd";
import { useNavigate } from "react-router-dom";
import { useCompare } from "../../context/CompareContext";
import { useAutoMarketI18n } from "../../utils/useAutoMarketI18n";
import { SwapOutlined } from "@ant-design/icons";

export default function CompareFloatBtn() {
  const { am } = useAutoMarketI18n();
  const { ids } = useCompare();
  const nav = useNavigate();
  if (!ids.length) return null;

  return (
    <div style={{ position: "fixed", right: 16, bottom: 92, zIndex: 1000 }}>
      <Badge count={ids.length} offset={[-4, 4]}>
        <Button
          type="primary"
          icon={<SwapOutlined />}
          onClick={() => nav("/auto-market/compare")}
          style={{
            borderRadius: 999,
            height: 44,
            padding: "0 16px",
            boxShadow: "0 16px 40px rgba(2,6,23,.18)",
            background: "linear-gradient(135deg,#2563eb,#22c55e)",
            border: "none"
          }}
        >
          {am("compare.title")}
        </Button>
      </Badge>
    </div>
  );
}
