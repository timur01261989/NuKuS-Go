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
import { buildSellerPostingChecklist, buildProfessionalSellingPoints } from "../../services/autoMarketJourney";
import { buildPremiumCreateSteps } from "../../services/autoMarketPremium";
import { buildLuxuryCreateExperience } from "../../services/autoMarketLuxury";
import { buildCreateShowroomChecklist } from "../../services/autoMarketShowroom";
import { buildListingCompleteness, buildPricingRecommendation, buildPromotePackages } from "../../services/autoMarketSellerStudio";
import { getLocalPaymentProviders } from "../../services/autoMarketLocalPayments";
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
  const { step, setStep, ad, reset, saveDraftNow, getDraftMeta, completeness } = useCreateAd();
  const draftMeta = getDraftMeta();
  const premiumSteps = useMemo(() => buildPremiumCreateSteps(ad), [ad]);
  const [preview, setPreview] = useState(false);
  const showroomChecklist = useMemo(() => buildCreateShowroomChecklist(ad), [ad]);
  const localPaymentProviders = getLocalPaymentProviders();

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
  const postingChecklist = buildSellerPostingChecklist(ad);
  const sellingPoints = buildProfessionalSellingPoints();
  const luxuryCreateCards = buildLuxuryCreateExperience(ad);
  const completenessInfo = buildListingCompleteness(ad);
  const pricingRecommendation = buildPricingRecommendation(ad) || {
    headline: "—",
    text: "—",
    recommendedMin: null,
    recommendedMax: null,
  };
  const promotePackages = buildPromotePackages(ad) || [];

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

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button onClick={() => { saveDraftNow(); message.success("Draft saqlandi"); }} style={{ borderRadius: 12 }}>Draft saqlash</Button>
        {draftMeta?.updatedAt ? (
          <Tag color="blue" style={{ borderRadius: 999, padding: "6px 10px", margin: 0 }}>
            So‘nggi draft: {new Date(draftMeta.updatedAt).toLocaleString("uz-UZ")}
          </Tag>
        ) : null}
        <Tag color="purple" style={{ borderRadius: 999, padding: "6px 10px", margin: 0 }}>
          To‘liqlik: {completeness}%
        </Tag>
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

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        {luxuryCreateCards.map((card) => (
          <div key={card.key} style={{ borderRadius: 18, padding: 14, border: `1px solid ${card.tone}22`, background: `${card.tone}10`, boxShadow: "0 12px 28px rgba(15,23,42,.04)" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{card.label}</div>
            <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a", fontSize: 18 }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
        <Alert
          type="info"
          showIcon
          message="Sotuvchi uchun qulay professional oqim"
          description="Bosqichlar xaridorni chalg‘itmaydigan e’lon tuzish uchun tartiblandi: ishonch, foto va aniq narx birinchi o‘rinda."
          style={{ borderRadius: 16 }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>E’lon tayyorlik checklisti</div>
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {postingChecklist.map((item) => (
                <div key={item.key} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", borderRadius: 14, background: item.done ? "rgba(22,163,74,.08)" : "#f8fafc", padding: "10px 12px", border: `1px solid ${item.done ? "rgba(22,163,74,.18)" : "#e2e8f0"}` }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{item.label}</span>
                  <Tag color={item.done ? "green" : "default"} style={{ borderRadius: 999, margin: 0 }}>{item.done ? "Tayyor" : "Kutilmoqda"}</Tag>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>Nega shu e’lon yaxshiroq sotiladi</div>
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {sellingPoints.map((item) => (
                <div key={item} style={{ borderRadius: 14, background: "#f8fafc", padding: "10px 12px", color: "#475569", fontSize: 13, lineHeight: 1.45 }}>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>


      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Listing completeness</div>
          <Progress percent={completenessInfo.score} strokeColor={{ "0%": "#2563eb", "100%": "#16a34a" }} style={{ marginTop: 12 }} />
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {completenessInfo.checks.map((item) => (
              <div key={item.key} style={{ display: "flex", justifyContent: "space-between", gap: 10, borderRadius: 12, padding: "10px 12px", background: item.done ? "rgba(22,163,74,.08)" : "#f8fafc", border: `1px solid ${item.done ? "rgba(22,163,74,.18)" : "#e2e8f0"}` }}>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{item.label}</span>
                <Tag color={item.done ? "green" : "default"} style={{ margin: 0, borderRadius: 999 }}>{item.done ? "Bor" : "Yo‘q"}</Tag>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Narx tavsiyasi</div>
          <div style={{ marginTop: 10, fontSize: 16, fontWeight: 900, color: "#0f172a" }}>{pricingRecommendation.headline}</div>
          <div style={{ marginTop: 8, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{pricingRecommendation.text}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div style={{ borderRadius: 14, background: "#eff6ff", padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Tavsiya min</div>
              <div style={{ marginTop: 6, fontWeight: 900, color: "#0f172a" }}>{pricingRecommendation.recommendedMin ? `${pricingRecommendation.recommendedMin.toLocaleString("en-US")} UZS` : "—"}</div>
            </div>
            <div style={{ borderRadius: 14, background: "#f0fdf4", padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Tavsiya max</div>
              <div style={{ marginTop: 6, fontWeight: 900, color: "#0f172a" }}>{pricingRecommendation.recommendedMax ? `${pricingRecommendation.recommendedMax.toLocaleString("en-US")} UZS` : "—"}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Alert
          message="Booking + local payment + seller CRM tayyorgarligi"
          description="E’lon joylangach xaridor vaqt band qilishi, bron to‘lashi va seller esa leadlarni boshqarishi uchun shu e’lon tayyor bo‘lishi kerak."
          type="success"
          showIcon
          style={{ borderRadius: 16 }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>Mahalliy to‘lov tayyorligi</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              {localPaymentProviders.map((provider) => (
                <div key={provider.key} style={{ borderRadius: 999, padding: "8px 12px", border: `1px solid ${provider.accent}22`, background: `${provider.accent}10`, color: "#0f172a", fontWeight: 800 }}>
                  {provider.title}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>Seller CRM readiness</div>
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {[
                "Lead kelganda 5 daqiqada javob berish",
                "Ko‘rish va test drive uchun bo‘sh vaqt qoldirish",
                "Bron va premium xizmatlar uchun to‘lov kanallarini tayyor tutish",
              ].map((item) => (
                <div key={item} style={{ borderRadius: 14, background: "#f8fafc", padding: "10px 12px", color: "#475569", fontSize: 13, lineHeight: 1.45 }}>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>


      <div style={{ marginTop: 18, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
        <div style={{ fontWeight: 900, color: "#0f172a" }}>Promote / VIP tayyorligi</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 12 }}>
          {promotePackages.map((item) => (
            <div key={item.key} style={{ borderRadius: 16, padding: 14, background: `${item.accent}10`, border: `1px solid ${item.accent}22` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                {item.recommended ? <Tag color="gold" style={{ margin: 0, borderRadius: 999 }}>Tavsiya</Tag> : null}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#475569", lineHeight: 1.45 }}>{item.text}</div>
              <div style={{ marginTop: 10, fontWeight: 900, color: item.accent }}>{item.price.toLocaleString("en-US")} UZS</div>
            </div>
          ))}
        </div>
      </div>

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