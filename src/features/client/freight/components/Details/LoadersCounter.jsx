import React from "react";
import { Button, Switch, Typography } from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { useFreight } from "../../context/FreightContext";
import { formatUZS, LOADERS_FEE_EACH } from "../../services/truckData";
const { Text } = Typography;

export default function LoadersCounter() {
  const { loadersEnabled, setLoadersEnabled, loadersCount, setLoadersCount } = useFreight();

  const inc = () => setLoadersCount((v) => Math.min(6, (Number(v) || 0) + 1));
  const dec = () => setLoadersCount((v) => Math.max(0, (Number(v) || 0) - 1));

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 900 }}>Yuklovchi kerakmi?</div>
          <Text type="secondary" style={{ fontSize: 12 }}>Har biri: +{formatUZS(LOADERS_FEE_EACH)}</Text>
        </div>
        <Switch checked={loadersEnabled} onChange={setLoadersEnabled} />
      </div>
      {loadersEnabled && (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button icon={<MinusOutlined />} onClick={dec} disabled={loadersCount <= 0} />
          <div style={{ width: 40, textAlign: "center", fontWeight: 1000 }}>{loadersCount}</div>
          <Button icon={<PlusOutlined />} onClick={inc} disabled={loadersCount >= 6} />
          <Text type="secondary" style={{ fontSize: 12 }}>kishi</Text>
        </div>
      )}
    </div>
  );
}
