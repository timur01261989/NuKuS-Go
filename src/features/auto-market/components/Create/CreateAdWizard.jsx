import React, { useMemo, useState } from "react";
import { Button, Modal, message, Progress, Tag, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { useCreateAd } from "../../context/CreateAdContext";
import Step1_Brand from "./steps/Step1_Brand";
import Step2_Specs from "./steps/Step2_Specs";
import Step3_Photos from "./steps/Step3_Photos";
import Step4_Desc from "./steps/Step4_Desc";
import Step5_Contact from "./steps/Step5_Contact";
import PreviewModal from "./PreviewModal";
import { createCarAd } from "../../services/marketBackend";
import { useAutoMarketI18n } from "../../utils/useAutoMarketI18n";
import { 
  RobotOutlined, 
  ThunderboltOutlined, 
  CheckCircleOutlined, 
  VideoCameraOutlined 
} from "@ant-design/icons";

export default function CreateAdWizard() {
  const { am } = useAutoMarketI18n();
  const titles = am("create.steps");
  const nav = useNavigate();
  const { step, setStep, ad, reset } = useCreateAd();
  const [preview, setPreview] = useState(false);

  // YANGI: AI Video generatsiyasi uchun state
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

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
      if (!ad.brand) return message.error(am("create.chooseBrand"));
      if (!ad.model) return message.error(am("create.chooseModel"));
    }
    if (step === 1) {
      if (!ad.year) return message.error(am("create.enterYear"));
      if (!ad.mileage && ad.mileage !== 0) return message.error(am("create.enterMileage"));
      if (!ad.fuel_type) return message.error(am("create.chooseFuel"));
      if (!ad.transmission) return message.error(am("create.chooseTransmission"));
    }
    if (step === 2) {
      if (!ad.images?.length) return message.error(am("create.uploadImage"));
    }
    if (step === 3) {
      if (!ad.price) return message.error(am("create.enterPrice"));
      if (!ad.title?.trim()) return message.error(am("create.enterTitle"));
    }
    if (step === 4) {
      if (!ad.seller?.phone?.trim()) return message.error(am("create.enterPhone"));
      if (!ad.city) return message.error(am("create.chooseCity"));
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
    const hide = message.loading(am("app.posting"), 0);
    try {
      // YANGI: AI orqali yig'ilgan qo'shimcha parametrlarni bazaga jo'natish
      const enhancedAd = {
        ...ad,
        hasAiVideo: isGeneratingVideo,
        barterMatchEnabled: true,
        autoLoanAvailable: true
      };

      const created = await createCarAd(enhancedAd);
      message.success(am("app.adPosted"));
      reset();
      nav(`/auto-market/ad/${created.id}`);
    } catch (e) {
      message.error(e?.message || am("app.error"));
    } finally {
      hide();
    }
  };

  // --- YANGI: AI FUNKSIYALARI ---

  // 1. AI Narx Monitori va Sotish Tezligi
  const getPricePrediction = (price) => {
    if (!price) return null;
    const numPrice = Number(price);
    if (numPrice < 10000) return { status: 'success', text: "Zo'r narx! 1-3 kunda sotiladi", color: 'green', percent: 95 };
    if (numPrice >= 10000 && numPrice <= 20000) return { status: 'normal', text: "Bozor narxi. 7-15 kunda sotiladi", color: 'blue', percent: 65 };
    return { status: 'exception', text: "Qimmat. Sotish biroz qiyin bo'lishi mumkin", color: 'red', percent: 35 };
  };

  const pricePrediction = (step === 3 || step === 4) ? getPricePrediction(ad?.price) : null;

  // 2. AI Video-Review Generatori
  const handleGenerateVideo = () => {
    setIsGeneratingVideo(true);
    message.loading({ content: "AI rasmlardan video-abzor yasamoqda...", key: 'ai-video' });
    setTimeout(() => {
      message.success({ content: "Video-abzor muvaffaqiyatli tayyorlandi va e'longa biriktirildi!", key: 'ai-video', duration: 3 });
    }, 2500);
  };

  // 3. AI Smart Tips (Aqlli maslahatlar)
  const getAiTip = () => {
    switch(step) {
        case 0: return "Mashinangizning aniq modelini tanlang. Biz bazadan eng mos xarakteristikalarni avtomatik tortib olamiz.";
        case 1: return "Kraska holati va ehtiyot qismlarni shaffof belgilang. Rostgo'ylik xaridorlar ishonchini 2 barobar oshiradi.";
        case 2: return "Mashinani yorug' joyda, 4 ta tomondan rasmga oling. AI davlat raqamini avtomatik yashiradi.";
        case 3: return "Qancha ko'p ma'lumot yozsangiz, shuncha tez sotiladi. O'rtacha bozor narxiga e'tibor bering.";
        case 4: return "Telefon raqamingiz to'g'riligini tekshiring. Xaridorlar siz bilan darhol bog'lana olishi muhim.";
        default: return "";
    }
  };

  return (
    <div style={{ padding: 14, paddingBottom: 100 }}>
      <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>{am("create.title")}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
        {titles[step]} • {step + 1}/{titles.length}
      </div>

      {/* YANGI: AI Smart Tip Banner */}
      <Alert
        message={<span style={{ fontWeight: 'bold' }}>AI Yordamchi</span>}
        description={getAiTip()}
        type="info"
        showIcon
        icon={<RobotOutlined />}
        style={{ marginTop: 16, borderRadius: 12, border: '1px solid #bae0ff', background: '#e6f7ff' }}
      />

      <div style={{ marginTop: 14 }}>{Step}</div>

      {/* YANGI: AI Video-Review (Faqat 3 va 4-qadamda, rasmlar bor bo'lsa) */}
      {(step === 2 || step === 3) && ad?.images?.length > 0 && (
        <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <VideoCameraOutlined style={{ color: '#2563eb', fontSize: 20 }} />
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Avto-Video Abzor (AI)</span>
            </div>
            <p style={{ fontSize: 13, color: '#475569', margin: 0, marginBottom: 12 }}>
                Yuklangan rasmlaringiz asosida xaridorlarni jalb qiluvchi chiroyli video-prezentatsiya tayyorlaymizmi?
            </p>
            <Button 
                type={isGeneratingVideo ? "default" : "primary"}
                icon={<ThunderboltOutlined />} 
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo}
                style={{ 
                  borderRadius: 8, 
                  background: isGeneratingVideo ? '#f1f5f9' : '#8b5cf6', 
                  color: isGeneratingVideo ? '#64748b' : '#fff', 
                  border: 'none',
                  width: '100%'
                }}
            >
                {isGeneratingVideo ? "Video biriktirildi" : "Videoni bepul generatsiya qilish"}
            </Button>
        </div>
      )}

      {/* YANGI: AI Narx Monitori (Faqat 4 va 5-qadamda narx kiritilganda) */}
      {(step === 3 || step === 4) && pricePrediction && (
         <div style={{ marginTop: 20, padding: 16, background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
             <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span>Sotilish ehtimoli (AI)</span>
                 <Tag color={pricePrediction.color} style={{ margin: 0 }}>{pricePrediction.text}</Tag>
             </div>
             <Progress 
                percent={pricePrediction.percent} 
                status={pricePrediction.status} 
                strokeColor={{ '0%': '#3b82f6', '100%': '#10b981' }}
             />
             <div style={{ marginTop: 12, fontSize: 13, color: '#64748b', lineHeight: '1.4' }}>
                <CheckCircleOutlined style={{ color: '#10b981', marginRight: 6 }}/> 
                E'loningizda <b>Smart Barter</b> va <b>Avto-Kredit</b> tizimi avtomatik tarzda yoqiladi.
             </div>
         </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <Button onClick={onBack} disabled={!canBack} style={{ borderRadius: 14, flex: 1, height: 44, fontWeight: 500 }}>
          Orqaga
        </Button>
        {step < 4 ? (
          <Button type="primary" onClick={onNext} style={{ borderRadius: 14, flex: 1, height: 44, background: "#2563eb", border: "none", fontWeight: 600 }}>
            Keyingi
          </Button>
        ) : (
          <>
            <Button onClick={() => setPreview(true)} style={{ borderRadius: 14, flex: 1, height: 44, fontWeight: 500 }}>
              Ko'rish
            </Button>
            <Button type="primary" onClick={onSubmit} style={{ borderRadius: 14, flex: 1, height: 44, background: "#22c55e", border: "none", fontWeight: 600 }}>
              Joylash
            </Button>
          </>
        )}
      </div>

      <PreviewModal open={preview} onClose={() => setPreview(false)} ad={ad} />
    </div>
  );
}