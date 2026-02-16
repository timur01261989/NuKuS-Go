import React from "react";
import { BRANDS, MODELS_BY_BRAND } from "../../../services/staticData";

export default function Step1_Brand({ draft, setDraft }) {
  const models = draft.brandId ? (MODELS_BY_BRAND[draft.brandId] || []) : [];

  return (
    <div>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>Marka va modelni tanlang</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Marka</div>
          <select
            value={draft.brandId || ""}
            onChange={(e) => setDraft({ brandId: Number(e.target.value), modelId: null })}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
          >
            <option value="">Tanlang…</option>
            {BRANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Model</div>
          <select
            value={draft.modelId || ""}
            onChange={(e) => setDraft({ modelId: Number(e.target.value) })}
            disabled={!draft.brandId}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
          >
            <option value="">Tanlang…</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
