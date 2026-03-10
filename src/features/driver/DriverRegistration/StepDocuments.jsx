import { useMemo, useState } from "react";
import { compressImage, isValidImageFile, makeFilePreview } from "./helpers";
import { DRIVER_DOCUMENT_FIELDS } from "./uploadConfig";

export default function StepDocuments({
  files,
  previews,
  updateFiles,
  updatePreviews,
  onBack,
  onSubmit,
  submitting,
}) {
  const [localError, setLocalError] = useState("");
  const [compressingKey, setCompressingKey] = useState("");

  const orderedFields = useMemo(() => DRIVER_DOCUMENT_FIELDS, []);

  const handleFileChange = async (event, key) => {
    const file = event.target.files?.[0];
    const config = orderedFields.find((item) => item.key === key);

    if (!file || !config) return;

    setLocalError("");

    if (!isValidImageFile(file)) {
      setLocalError("Faqat rasm fayl yuklash mumkin");
      return;
    }

    try {
      setCompressingKey(key);
      const compressed = await compressImage(file, {
        maxWidth: config.maxWidth,
        quality: config.quality,
      });

      updateFiles({ [key]: compressed });
      updatePreviews({ [key]: makeFilePreview(compressed) });
    } catch (error) {
      setLocalError(error?.message || "Rasmni qayta ishlashda xato");
    } finally {
      setCompressingKey("");
      event.target.value = "";
    }
  };

  return (
    <div>
      <h3>Hujjatlar</h3>

      {localError ? <div style={{ color: "red" }}>{localError}</div> : null}

      {orderedFields.map((field) => {
        const preview = previews[field.key];
        const isProcessing = compressingKey === field.key;

        return (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6 }}>
              {field.label}
              {field.required ? " *" : ""}
            </label>

            <input
              type="file"
              accept={field.accept}
              disabled={submitting || isProcessing}
              onChange={(e) => handleFileChange(e, field.key)}
            />

            {isProcessing ? (
              <div style={{ marginTop: 8 }}>Rasm siqilmoqda...</div>
            ) : null}

            {preview?.url ? (
              <div style={{ marginTop: 8 }}>
                <img
                  src={preview.url}
                  alt={field.label}
                  style={{ width: 160, height: 120, objectFit: "cover", borderRadius: 8 }}
                />
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {preview.name || field.label}
                </div>
                {preview.size ? (
                  <div style={{ fontSize: 12 }}>
                    {(preview.size / 1024).toFixed(1)} KB
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

      <button type="button" onClick={onBack} disabled={submitting}>
        Ortga
      </button>

      <button type="button" onClick={onSubmit} disabled={submitting || !!compressingKey}>
        {submitting ? "Yuborilmoqda..." : "Yuborish"}
      </button>
    </div>
  );
}
