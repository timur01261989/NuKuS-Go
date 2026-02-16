import React from "react";

export default function Step4_Desc({ draft, setDraft }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Narx</div>
        <input
          type="number"
          value={draft.price || ""}
          onChange={(e) => setDraft({ price: Number(e.target.value) })}
          placeholder="145000000"
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
        />
      </div>
      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Valyuta</div>
        <select
          value={draft.currency || "UZS"}
          onChange={(e) => setDraft({ currency: e.target.value })}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
        >
          <option value="UZS">UZS</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Tavsif</div>
        <textarea
          value={draft.desc || ""}
          onChange={(e) => setDraft({ desc: e.target.value })}
          placeholder="Mashina holati, variantlar, muammolar bo'lsa yozing..."
          rows={6}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", resize: "vertical" }}
        />
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>Tavsiya: kamida 10 ta belgi.</div>
      </div>
    </div>
  );
}
