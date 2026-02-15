
import React from "react";
import { Drawer, Button } from "antd";

export default function ShareSheet({ open, onClose, url }) {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  return (
    <Drawer open={open} onClose={onClose} placement="bottom" height={220} title="Ulashish">
      <div style={{ display: "grid", gap: 10 }}>
        <Button
          type="primary"
          onClick={() => {
            if (navigator.share) navigator.share({ title: "E'lon", url: shareUrl }).catch(() => {});
            else navigator.clipboard?.writeText(shareUrl);
          }}
          style={{ borderRadius: 12 }}
        >
          Havolani ulashish
        </Button>
        <Button onClick={() => navigator.clipboard?.writeText(shareUrl)} style={{ borderRadius: 12 }}>
          Nusxa olish
        </Button>
      </div>
    </Drawer>
  );
}
