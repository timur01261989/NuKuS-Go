import React, { useMemo, useState } from "react";
import { Button, Modal, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useCreateAd } from "../../context/CreateAdContext";
import Step1_Brand from "./steps/Step1_Brand";
import Step2_Specs from "./steps/Step2_Specs";
import Step3_Photos from "./steps/Step3_Photos";
import Step4_Desc from "./steps/Step4_Desc";
import Step5_Contact from "./steps/Step5_Contact";
import PreviewModal from "./PreviewModal";
import { createCarAd } from "../../services/marketBackend";

const titles = ["Marka/Model", "Parametrlar", "Rasmlar", "Narx & Tavsif", "Kontakt"];

export default function CreateAdWizard() {
  const nav = useNavigate();
  const { step, setStep, ad, reset } = useCreateAd();
  const [preview, setPreview] = useState(false);

  const Step = useMemo(() => {
    switch (step) {
      case 0: return <Step1_Brand />;
      case 1: return <Step2_Specs />;
      case 2: return <Step3_Photos />;
      case 3: return <Step4_Desc />;
      case 4: return <Step5_Contact />;
      default: return <Step1_Brand />;
    }
  }, [step]);

  const canBack = step > 0;
  const canNext = step < 4;

  const validateStep = () => {
    if (step === 0) {
      if (!ad.brand) return message.error("Marka tanlang");
      if (!ad.model) return message.error("Model tanlang");
    }
    if (step === 1) {
      if (!ad.year) return message.error("Yil kiriting");
      if (!ad.mileage && ad.mileage !== 0) return message.error("Probeg kiriting");
      if (!ad.fuel_type) return message.error("Yoqilg'i turini tanlang");
      if (!ad.transmission) return message.error("Uzatma turini tanlang");
    }
    if (step === 2) {
      if (!ad.images?.length) return message.error("Kamida 1 ta rasm yuklang");
    }
    if (step === 3) {
      if (!ad.price) return message.error("Narx kiriting");
      if (!ad.title?.trim()) return message.error("Sarlavha kiriting");
    }
    if (step === 4) {
      if (!ad.seller?.phone?.trim()) return message.error("Telefon raqam kiriting");
      if (!ad.city) return message.error("Shahar tanlang");
    }
    return true;
  };

  const onNext = () => {
    if (!validateStep()) return;
    if (canNext) setStep(step + 1);
  };

  const onBack = () => {
    if (canBack) setStep(step - 1);
  };

  const onSubmit = async () => {
    if (!validateStep()) return;
    const hide = message.loading("E'lon joylanmoqda...", 0);
    try {
      const created = await createCarAd(ad);
      message.success("E'lon joylandi");
      reset();
      nav(`/auto-market/ad/${created.id}`);
    } catch (e) {
      message.error(e?.message || "Xatolik");
    } finally {
      hide();
    }
  };

  return (
    <div style={{ padding: 14 }}>
      <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>E'lon berish</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
        {titles[step]} • {step + 1}/{titles.length}
      </div>

      <div style={{ marginTop: 14 }}>{Step}</div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <Button onClick={onBack} disabled={!canBack} style={{ borderRadius: 14, flex: 1 }}>
          Orqaga
        </Button>
        {step < 4 ? (
          <Button type="primary" onClick={onNext} style={{ borderRadius: 14, flex: 1, background: "#2563eb", border: "none" }}>
            Keyingi
          </Button>
        ) : (
          <>
            <Button onClick={() => setPreview(true)} style={{ borderRadius: 14, flex: 1 }}>
              Ko'rish
            </Button>
            <Button type="primary" onClick={onSubmit} style={{ borderRadius: 14, flex: 1, background: "#22c55e", border: "none" }}>
              Joylash
            </Button>
          </>
        )}
      </div>

      <PreviewModal open={preview} onClose={() => setPreview(false)} ad={ad} />
    </div>
  );
}
