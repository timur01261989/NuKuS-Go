import React from "react";
import { Modal } from "antd";
import GallerySlider from "../Details/GallerySlider";
import PriceTag from "../Common/PriceTag";

export default function PreviewModal({ open, onClose, ad }) {
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={860} centered>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }}>
        <GallerySlider images={ad?.images || []} />
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>{ad?.title || "Sarlavha"}</div>
          <div style={{ marginTop: 8 }}>
            <PriceTag price={ad?.price} currency={ad?.currency} size={18} />
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
            {ad?.brand} {ad?.model} • {ad?.year} • {ad?.mileage} km
          </div>
          <div style={{ marginTop: 12, whiteSpace: "pre-wrap", color: "#0f172a" }}>
            {ad?.description || "Tavsif..."}
          </div>
        </div>
      </div>
    </Modal>
  );
}
