import React from "react";
import { Button, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useIntercity } from "../../context/IntercityContext";
import { useClientText } from "../../shared/i18n_clientLocalize";

const { Title, Text } = Typography;

export default function RouteHeader() {
  const nav = useNavigate();
  const { fromCity, toCity } = useIntercity();
  const { cp } = useClientText();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
      <Button
        shape="circle"
        icon={<ArrowLeftOutlined />}
        onClick={() => nav(-1)}
        style={{ border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.08)" }}
      />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <Title level={5} style={{ margin: 0 }}>
          {fromCity?.title || cp("Shahar")} <span style={{ opacity: 0.6 }}>➝</span> {toCity?.title || cp("Shahar")}
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {cp("Intercity (viloyatlararo) reyslar")}
        </Text>
      </div>
    </div>
  );
}
