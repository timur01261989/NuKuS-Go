
import React from "react";
import { Button, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export default function MarketHeader({ title, showBack, right }) {
  const nav = useNavigate();
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 30,
      background: "white",
      borderBottom: "1px solid #f0f0f0",
      padding: "10px 12px",
      display: "flex",
      alignItems: "center",
      gap: 10
    }}>
      {showBack ? (
        <Button
          shape="circle"
          icon={<ArrowLeftOutlined />}
          onClick={() => nav(-1)}
        />
      ) : null}
      <Typography.Title level={5} style={{ margin: 0, flex: 1 }}>
        {title || "Market"}
      </Typography.Title>
      {right ? <div>{right}</div> : null}
    </div>
  );
}
