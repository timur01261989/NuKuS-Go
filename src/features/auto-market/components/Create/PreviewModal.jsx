import React from "react";
import PriceTag from "../Common/PriceTag";
import StatusBadge from "../Common/StatusBadge";

export default function PreviewModal({ open, onClose, draft }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(920px, 100%)",
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900 }}>Preview</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}>
            ×
          </button>
        </div>

        <div style={{ padding: 14, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <StatusBadge status="new" />
            <div style={{ fontWeight: 900 }}>E'loningiz qanday ko'rinadi</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14 }}>
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
              <img
                src={(draft.photos || [])[0]?.preview || (draft.photos || [])[0]?.url || "https://placehold.co/640x480?text=Car"}
                alt=""
                style={{ width: "100%", height: 220, objectFit: "cover" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Brand #{draft.brandId || "?"} • Model #{draft.modelId || "?"}</div>
              <PriceTag price={draft.price || 0} currency={draft.currency || "UZS"} />
              <div style={{ marginTop: 10, opacity: 0.75 }}>{draft.desc || "Tavsif kiritilmagan"}</div>
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                Tel: {draft.phone || "—"} • Shahar: {draft.location?.city || "—"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 14, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{ border: "none", background: "#1677ff", color: "#fff", padding: "10px 12px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
