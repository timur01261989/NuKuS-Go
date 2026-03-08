import React from "react";
import { useClientText } from "../../shared/i18n_clientLocalize";
import { Button, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

/**
 * DistrictHeader.jsx
 * -------------------------------------------------------
 * cp("{cp("{cp("Nukusdan qayerga?")}")}") sarlavhasi va orqaga tugma.
 */
export default function DistrictHeader({ onBack }) {
  const { cp } = useClientText();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
      <Button icon={<ArrowLeftOutlined />} onClick={onBack} />
      <Typography.Title level={5} style={{ margin: 0 }}>
        {cp("Nukusdan qayerga?")}
      </Typography.Title>
    </div>
  );
}