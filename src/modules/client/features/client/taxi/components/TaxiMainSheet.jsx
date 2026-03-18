import React from "react";
import { Button } from "antd";
import { HomeOutlined, BankOutlined, CarOutlined } from "@ant-design/icons";

export default function TaxiMainSheet({
  homeAddr,
  workAddr,
  savedPlaces,
  pickupSummaryRow,
  openDestinationSearch,
  applyDestinationFromAddressString,
  handlePickSaved,
  handleOrderCreate,
  onTariffOpen,
}) {
  return (
    <div className="yg-sheet">
      <div className="yg-sheet-title">
        <div className="yg-logo" />
        <div style={{ fontSize: 30, fontWeight: 800 }}>Taksi</div>
      </div>

      <Button className="yg-long" onClick={openDestinationSearch}>
        Qaerga borasiz?
        <span className="yg-long-right">›</span>
      </Button>

      <div style={{ marginTop: 12 }}>{pickupSummaryRow}</div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Mening manzillarim</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <Button
            icon={<HomeOutlined />}
            style={{ flex: 1, borderRadius: 12 }}
            disabled={!homeAddr}
            onClick={() => applyDestinationFromAddressString(homeAddr?.address)}
          >
            Uy
          </Button>
          <Button
            icon={<BankOutlined />}
            style={{ flex: 1, borderRadius: 12 }}
            disabled={!workAddr}
            onClick={() => applyDestinationFromAddressString(workAddr?.address)}
          >
            Ish
          </Button>
        </div>
        {(savedPlaces?.length ?? 0) === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.55, padding: "8px 0" }}>Hozircha saqlangan manzil yo'q</div>
        ) : (
          <div className="yg-saved">
            {(savedPlaces || []).slice(0, 4).map((place) => (
              <button
                key={place.id || place.place_id || `${place.lat},${place.lng}`}
                className="yg-saved-item"
                onClick={() => handlePickSaved(place)}
              >
                <div className="yg-saved-ic">📍</div>
                <div className="yg-saved-txt">
                  <div className="yg-saved-title">{place.name || place.title || "Manzil"}</div>
                  <div className="yg-saved-sub">{place.label || ""}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="yg-bottom-row">
        <Button className="yg-blue" type="primary" onClick={handleOrderCreate}>
          Buyurtma berish
        </Button>
        <Button className="yg-round" icon={<CarOutlined />} onClick={onTariffOpen} />
      </div>
    </div>
  );
}
