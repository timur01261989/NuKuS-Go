import { ct } from "./shared/i18n_componentLocalize";
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
  title,
  subtitle,
  onCancel,
  onConfirm,
  cancelText,
  confirmText,
}) {
  const safeTitle = title || ct("orderTitle", ct("orders", "Buyurtma"));
  const safeSubtitle = subtitle || ct("details", "Tafsilotlar");
  const safeCancelText = cancelText || ct("cancelOrder", ct("cancel", "Bekor qilish"));
  const safeConfirmText = confirmText || ct("confirm", "Tasdiqlash");
  const distanceLabel = ct("distance", "Masofa");
  const priceLabel = ct("price", "Narx");
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
            <span>{distanceLabel}</span>
            <span className="sub">{distanceText}</span>
          </div>
        </div>

        <div className="hdr-chip">
          <span>{priceLabel}</span>
          <span className="sub">{priceText}</span>
        </div>
      </div>

      <div className="hdr-sheet">
        <div className="hdr-sheet-handle" />
        <div className="hdr-sheet-body">
          <div className="hdr-row">
            <div>
              <div className="hdr-title">{safeTitle}</div>
              <div className="hdr-subtitle">{safeSubtitle}</div>
            </div>
          </div>

          <div className="hdr-actions">
            <Button onClick={onCancel} className="hdr-btn-neon">
              {safeCancelText}
            </Button>
            <Button type="primary" onClick={onConfirm}>
              {safeConfirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}//1
