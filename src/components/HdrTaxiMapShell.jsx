import React from "react";
import { Button } from "antd";

/**
 * children => Leaflet MapContainer
 * props:
 *  - etaText: "3 min"
 *  - priceText: "18 000 so'm"
 *  - distanceText: "2.6 km"
 *  - title: "Haydovchi qidirilmoqda"
 *  - subtitle: "Sizga eng yaqin haydovchini topyapmiz"
 */
export default function HdrTaxiMapShell({
  children,
  etaText = "—",
  priceText = "—",
  distanceText = "—",
  title = "Buyurtma",
  subtitle = "Tafsilotlar",
  onCancel,
  onConfirm,
  cancelText = "Bekor qilish",
  confirmText = "Tasdiqlash",
}) {
  return (
    <div className="hdr-map-shell">
      {children}

      <div className="hdr-map-topbar">
        <div className="hdr-chip-row">
          <div className="hdr-chip">
            <span>ETA</span>
            <span className="sub">{etaText}</span>
          </div>
          <div className="hdr-chip">
            <span>Masofa</span>
            <span className="sub">{distanceText}</span>
          </div>
        </div>

        <div className="hdr-chip">
          <span>Narx</span>
          <span className="sub">{priceText}</span>
        </div>
      </div>

      <div className="hdr-sheet">
        <div className="hdr-sheet-handle" />
        <div className="hdr-sheet-body">
          <div className="hdr-row">
            <div>
              <div className="hdr-title">{title}</div>
              <div className="hdr-subtitle">{subtitle}</div>
            </div>
          </div>

          <div className="hdr-actions">
            <Button onClick={onCancel} className="hdr-btn-neon">
              {cancelText}
            </Button>
            <Button type="primary" onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}//1
