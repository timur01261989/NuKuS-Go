
import React from "react";
import { Button } from "antd";
import { PhoneOutlined, MessageOutlined, ShareAltOutlined } from "@ant-design/icons";

export default function SellerCard({ seller }) {
  const phone = seller?.phone || "";
  return (
    <div style={{ padding: 12 }}>
      <div style={{ background: "white", border: "1px solid #f0f0f0", borderRadius: 16, padding: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{seller?.name || "Sotuvchi"}</div>
        <div style={{ color: "#777", fontSize: 12, marginTop: 4 }}>{phone}</div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <Button
            type="primary"
            icon={<PhoneOutlined />}
            href={phone ? `tel:${phone}` : undefined}
            disabled={!phone}
            style={{ borderRadius: 12, flex: 1 }}
          >
            Aloqa
          </Button>
          <Button icon={<MessageOutlined />} style={{ borderRadius: 12 }}>
            Chat
          </Button>
          <Button
            icon={<ShareAltOutlined />}
            style={{ borderRadius: 12 }}
            onClick={() => {
              const url = window.location.href;
              if (navigator.share) navigator.share({ title: "E'lon", url }).catch(() => {});
              else navigator.clipboard?.writeText(url);
            }}
          />
        </div>
      </div>
    </div>
  );
}
