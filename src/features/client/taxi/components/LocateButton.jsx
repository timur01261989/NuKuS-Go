import React from "react";
import { Button } from "antd";
import { AimOutlined } from "@ant-design/icons";

/**
 * LocateButton
 * - "Mening joylashuvim" tugmasi (🎯)
 * - Bosilganda xarita userLoc ga flyTo qiladi
 */
export default function LocateButton({ mapRef, userLoc, onRequestLocate, bottom = 240 }) {
  return (
    <div style={{ position: "absolute", right: 16, bottom, zIndex: 800 }}>
      <Button
        shape="circle"
        size="large"
        icon={<AimOutlined style={{ fontSize: 22 }} />}
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        onClick={() => {
          const map = mapRef?.current;
          if (map && userLoc) {
            map.flyTo(userLoc, 16, { duration: 0.6 });
            return;
          }
          onRequestLocate?.();
        }}
      />
    </div>
  );
}
