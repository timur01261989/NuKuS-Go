import React, { useState } from "react";
import { useClientText } from "../../shared/i18n_clientLocalize";
import { Button } from "antd";
import { AimOutlined, LoadingOutlined } from "@ant-design/icons";

/**
 * LocateButton
 * - cp("Mening joylashuvim") tugmasi (🎯)
 * - Bosilganda:
 *   1) onRequestLocate() chaqiradi (GPS ni yangilash uchun)
 *   2) userLoc bo'lsa xaritani userLoc ga flyTo qiladi
 */
export default function LocateButton({ mapRef, userLoc, bottom = 240, onRequestLocate }) {
  const { cp } = useClientText();
  const [loading, setLoading] = useState(false);

  const fly = (loc) => {
    const map = mapRef?.current;
    if (map && loc) map.flyTo(loc, 16, { duration: 0.6 });
  };

  return (
    <div style={{ position: "absolute", right: 16, bottom, zIndex: 800 }}>
      <Button
        shape="circle"
        size="large"
        icon={loading ? <LoadingOutlined style={{ fontSize: 22 }} /> : <AimOutlined style={{ fontSize: 22 }} />}
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        onClick={async () => {
          try {
            setLoading(true);
            // Try to refresh GPS first
            const next = await onRequestLocate?.();
            if (next && Array.isArray(next) && next.length === 2) {
              fly(next);
              return;
            }
            // Fallback to last known
            fly(userLoc);
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
}