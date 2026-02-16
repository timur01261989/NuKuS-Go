import React from "react";
import { CITIES } from "../../../services/staticData";

export default function Step5_Contact({ draft, setDraft }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Telefon</div>
        <input
          value={draft.phone || ""}
          onChange={(e) => setDraft({ phone: e.target.value })}
          placeholder="+998 90 123 45 67"
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
        />
      </div>

      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Shahar</div>
        <select
          value={draft.location?.city || ""}
          onChange={(e) => setDraft({ location: { ...(draft.location || {}), city: e.target.value } })}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
        >
          <option value="">Tanlang…</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Manzil koordinatalari (ixtiyoriy)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input
            type="number"
            value={draft.location?.lat ?? ""}
            onChange={(e) => setDraft({ location: { ...(draft.location || {}), lat: Number(e.target.value) } })}
            placeholder="lat"
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
          />
          <input
            type="number"
            value={draft.location?.lng ?? ""}
            onChange={(e) => setDraft({ location: { ...(draft.location || {}), lng: Number(e.target.value) } })}
            placeholder="lng"
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
          />
        </div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>Keyin xarita qo‘shilsa, shu joy avtomatik to‘ladi.</div>
      </div>
    </div>
  );
}
