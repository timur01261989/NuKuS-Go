
import React, { useMemo } from "react";
import { message } from "antd";
import BackNavLayout from "../layouts/BackNavLayout";
import { CreateAdProvider, useCreateAd } from "../context/CreateAdContext";
import StepHeader from "../components/Create/StepHeader";
import BasicInfoStep from "../components/Create/BasicInfoStep";
import ParamsStep from "../components/Create/ParamsStep";
import PriceStep from "../components/Create/PriceStep";
import ImagesStep from "../components/Create/ImagesStep";
import ContactStep from "../components/Create/ContactStep";
import CreateFooter from "../components/Create/CreateFooter";
import { createAd } from "../services/marketApi";
import { useNavigate } from "react-router-dom";

const stepTitles = ["Asosiy", "Parametrlar", "Narx", "Rasm", "Kontakt"];

function WizardInner() {
  const { step, ad, reset } = useCreateAd();
  const nav = useNavigate();

  const Step = useMemo(() => {
    switch (step) {
      case 0: return <BasicInfoStep />;
      case 1: return <ParamsStep />;
      case 2: return <PriceStep />;
      case 3: return <ImagesStep />;
      case 4: return <ContactStep />;
      default: return <BasicInfoStep />;
    }
  }, [step]);

  const onSubmit = async () => {
    if (!ad.title?.trim()) return message.error("Sarlavha kiriting");
    if (!ad.price) return message.error("Narx kiriting");
    const hide = message.loading("E'lon yaratilmoqda...", 0);
    try {
      const created = await createAd(ad);
      message.success("E'lon yaratildi");
      reset();
      nav(`/market/ad/${created.id}`);
    } catch (e) {
      message.error("Xatolik: " + (e?.message || "server"));
    } finally {
      hide();
    }
  };

  return (
    <>
      <StepHeader titles={stepTitles} />
      {Step}
      <CreateFooter totalSteps={stepTitles.length} onSubmit={onSubmit} />
    </>
  );
}

export default function CreateAdWizard() {
  return (
    <CreateAdProvider>
      <BackNavLayout title="Sotish">
        <WizardInner />
      </BackNavLayout>
    </CreateAdProvider>
  );
}
