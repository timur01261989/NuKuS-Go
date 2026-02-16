import React, { useRef } from "react";
import { compressImage } from "../../../utils/imageUtils";

export default function Step3_Photos({ draft, setDraft }) {
  const inputRef = useRef(null);

  const addPhotos = async (files) => {
    const list = Array.from(files || []);
    const compressed = [];
    for (const f of list) {
      try {
        const cf = await compressImage(f, { maxSizeMB: 1.2, maxWidthOrHeight: 1600 });
        compressed.push({ file: cf, preview: URL.createObjectURL(cf) });
      } catch (e) {
        compressed.push({ file: f, preview: URL.createObjectURL(f) });
      }
    }
    setDraft({ photos: [...(draft.photos || []), ...compressed] });
  };

  const removeAt = (i) => {
    const next = (draft.photos || []).slice();
    next.splice(i, 1);
    setDraft({ photos: next });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 900 }}>Rasmlar</div>
        <button
          onClick={() => inputRef.current?.click()}
          style={{ border: "1px solid rgba(0,0,0,0.12)", background: "#fff", padding: "8px 10px", borderRadius: 10, fontWeight: 800 }}
        >
          + Qo'shish
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => addPhotos(e.target.files)} />

      {(draft.photos || []).length === 0 ? (
        <div style={{ opacity: 0.7 }}>Kamida 1 ta rasm yuklang</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {(draft.photos || []).map((p, idx) => (
            <div key={idx} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
              <img src={p.preview || p.url} alt="" style={{ width: "100%", height: 120, objectFit: "cover" }} />
              <button
                onClick={() => removeAt(idx)}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  border: "none",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
