import React from "react";
import { COLORS, FUELS, TRANSMISSIONS } from "../../../services/staticData";

export default function Step2_Specs({ draft, setDraft }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Yil</div>
        <input
          type="number"
          value={draft.year || ""}
          onChange={(e) => setDraft({ year: Number(e.target.value) })}
          placeholder="2023"
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
        />
      </div>

      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Probeg (km)</div>
        <input
          type="number"
          value={draft.mileage ?? ""}
          onChange={(e) => setDraft({ mileage: Number(e.target.value) })}
          placeholder="120000"
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
        />
      </div>

      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Rang</div>
        <select
          value={draft.color || ""}
          onChange={(e) => setDraft({ color: e.target.value })}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
        >
          <option value="">Tanlang…</option>
          {COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Yoqilg'i</div>
        <select
          value={draft.fuel || ""}
          onChange={(e) => setDraft({ fuel: e.target.value })}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
        >
          <option value="">Tanlang…</option>
          {FUELS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Uzatma</div>
        <select
          value={draft.transmission || ""}
          onChange={(e) => setDraft({ transmission: e.target.value })}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
        >
          <option value="">Tanlang…</option>
          {TRANSMISSIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>VIN (ixtiyoriy)</div>
        <input
          value={draft.vin || ""}
          onChange={(e) => setDraft({ vin: e.target.value })}
          placeholder="WVWZZZ1JZXW000001"
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
        />
      </div>
    </div>
  );
}
