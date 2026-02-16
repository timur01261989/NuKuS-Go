import React, { useMemo, useState } from "react";
import { useMarketStore } from "../../stores/marketStore";
import { useMarket } from "../../context/MarketContext";

import Step1_Brand from "./steps/Step1_Brand";
import Step2_Specs from "./steps/Step2_Specs";
import Step3_Photos from "./steps/Step3_Photos";
import Step4_Desc from "./steps/Step4_Desc";
import Step5_Contact from "./steps/Step5_Contact";
import PreviewModal from "./PreviewModal";

/**
 * 🪄 CreateAdWizard.jsx (E'lon berish "Sehrgari")
 *
 * - Step-by-step wizard
 * - Draft: Zustand persist orqali saqlanadi (Orqaga bosganda o'chmaydi)
 * - Validatsiya: muhim maydonlar to'ldirilmasa submit qilmaydi
 */

const STEPS = [
  { key: "brand", title: "Marka/Model", Comp: Step1_Brand },
  { key: "specs", title: "Xususiyatlar", Comp: Step2_Specs },
  { key: "photos", title: "Rasmlar", Comp: Step3_Photos },
  { key: "desc", title: "Narx/Tavsif", Comp: Step4_Desc },
  { key: "contact", title: "Kontakt/Manzil", Comp: Step5_Contact },
];

export default function CreateAdWizard() {
  const { draft, setDraft, resetDraft } = useMarketStore();
  const { submitAd } = useMarket();

  const [step, setStep] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const current = STEPS[step];

  const canNext = useMemo(() => {
    if (current.key === "brand") return !!draft.brandId && !!draft.modelId;
    if (current.key === "specs") return !!draft.year && (draft.mileage === 0 || !!draft.mileage) && !!draft.fuel && !!draft.transmission;
    if (current.key === "photos") return (draft.photos || []).length >= 1;
    if (current.key === "desc") return !!draft.price && String(draft.desc || "").trim().length >= 10;
    if (current.key === "contact") return String(draft.phone || "").replace(/\D/g, "").length >= 9 && !!draft.location?.city;
    return true;
  }, [current.key, draft]);

  const goNext = () => {
    if (!canNext) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!canNext) return;
    setSubmitting(true);
    try {
      await submitAd(draft);
      resetDraft();
      setStep(0);
      alert("E'lon muvaffaqiyatli joylandi ✅");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("create ad error", e);
      alert("E'lon joylashda xatolik: " + (e?.message || "Server bilan aloqa yo'q"));
    } finally {
      setSubmitting(false);
    }
  };

  const StepComp = current.Comp;

  return (
    <div style={{ padding: 16, maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>
          E'lon berish — {current.title} ({step + 1}/{STEPS.length})
        </div>
        <button
          onClick={() => setPreviewOpen(true)}
          style={{ border: "1px solid rgba(0,0,0,0.12)", background: "#fff", borderRadius: 10, padding: "8px 10px", fontWeight: 800 }}
        >
          Preview
        </button>
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: 14 }}>
        <StepComp draft={draft} setDraft={setDraft} />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          onClick={goBack}
          disabled={step === 0 || submitting}
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            background: "#fff",
            borderRadius: 12,
            padding: "10px 12px",
            fontWeight: 900,
            cursor: step === 0 ? "not-allowed" : "pointer",
            opacity: step === 0 ? 0.5 : 1,
          }}
        >
          Orqaga
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={goNext}
            disabled={!canNext || submitting}
            style={{
              marginLeft: "auto",
              border: "none",
              background: canNext ? "#1677ff" : "#9fbff5",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 900,
              cursor: canNext ? "pointer" : "not-allowed",
            }}
          >
            Keyingi
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canNext || submitting}
            style={{
              marginLeft: "auto",
              border: "none",
              background: canNext ? "#22c55e" : "#a7f3d0",
              color: "#0b3d1c",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 900,
              cursor: canNext ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "Yuborilmoqda..." : "E'lonni joylash"}
          </button>
        )}
      </div>

      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} draft={draft} />
    </div>
  );
}
