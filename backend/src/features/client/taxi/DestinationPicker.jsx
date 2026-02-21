import React from "react";
import { Button } from "antd";
import { CheckOutlined } from "@ant-design/icons";

/**
 * DestinationPicker (dest_map step)
 * - Xarita markazi bo‘yicha yakuniy nuqta tanlash
 * - Pastdan mini-sheet (auto hide/show) tashqaridan boshqariladi
 */
export default function DestinationPicker({
  showSheet = true,
  dest,
  pickup,
  totalPrice,
  money,
  haversineKm,
  MAX_KM = 50,
  message,
  onConfirm,
}) {
  return (
    <div className={"yg-sheet " + (showSheet ? "" : "hidden")}>
      <div className="yg-dest-mini">
        <div className="yg-dest-mini-left">
          <div className="yg-field-label">Yakuniy nuqta</div>
          <div className="yg-field-value">{dest?.address || "Manzil aniqlanmoqda..."}</div>
        </div>

        <div className="yg-dest-mini-right">
          <div className="yg-price">{money ? money(totalPrice) : totalPrice}</div>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            className="yg-ready"
            onClick={() => {
              if (pickup?.latlng && dest?.latlng) {
                const d = haversineKm(pickup.latlng, dest.latlng);
                if (d > MAX_KM) {
                  message?.error?.(`Masofa belgilangan me'yoridan ortiq (${MAX_KM} km)`);
                  return;
                }
              }
              onConfirm?.();
            }}
          >
            Tayyor
          </Button>
        </div>
      </div>
    </div>
  );
}
