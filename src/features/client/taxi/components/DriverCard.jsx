import React from "react";
import { Avatar, Button, Tag } from "antd";
import { StarFilled, UserOutlined, PhoneOutlined, MessageOutlined } from "@ant-design/icons";

/** Driver card (UI) */
export default function DriverCard({ driver, etaMin, onCall, onChat }) {
  return (
    <div className="yg-driver-card">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Avatar size={48} src={driver?.avatar_url} icon={<UserOutlined />} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900 }}>{driver?.first_name || "Haydovchi"}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {driver?.car_model} • {driver?.car_plate}
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
            <Tag color="gold" style={{ margin: 0 }}>
              <StarFilled /> {driver?.rating || 4.9}
            </Tag>
            {typeof etaMin === "number" ? <Tag color="blue" style={{ margin: 0 }}>{etaMin} daq</Tag> : null}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button shape="circle" icon={<PhoneOutlined />} onClick={onCall} />
          <Button shape="circle" icon={<MessageOutlined />} onClick={onChat} />
        </div>
      </div>
    </div>
  );
}
