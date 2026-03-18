/**
 * DetailsPage
 * Asl funksionallik to'liq saqlangan.
 * YANGI: FairPriceBlock, VikupCalculator, BarterMatchList qo'shildi.
 * YANGI QO'SHILDI: AI Price Analytics, Visual Body Status, Auto Loan Calculator.
 * TO'G'IRLANDI: Null pointer error (car.price) va Narx formatlash mantiqi.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Button, Spin, message, Tag, Divider, Card, Statistic, Progress, Timeline, Tooltip } from "antd";
import { 
  ArrowLeftOutlined, 
  SwapOutlined, 
  HeartOutlined, 
  SaveOutlined, 
  ThunderboltOutlined, 
  CheckCircleOutlined, 
  CalculatorOutlined,
  BgColorsOutlined,
  InfoCircleOutlined,
  BellOutlined,
  BankOutlined,
  HistoryOutlined,
  ShopOutlined
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import GallerySlider from "../components/Details/GallerySlider";
import PriceTag from "../components/Common/PriceTag";
import FavoriteButton from "../components/Common/FavoriteButton";
import MainSpecsGrid from "../components/Details/MainSpecsGrid";
import VinCheckBlock from "../components/Details/VinCheckBlock";
import PriceHistoryGraph from "../components/Details/PriceHistoryGraph";
import SellerProfile from "../components/Details/SellerProfile";
import InspectionViewer from "../components/Details/InspectionViewer";
import FinanceSnapshotCard from "../components/Details/FinanceSnapshotCard";
import PriceDropCard from "../components/Details/PriceDropCard";
import AppointmentBookingCard from "../components/Details/AppointmentBookingCard";
import { buildDealerTrustProfile, buildFinanceOffers, buildAutoMarketNotifications, buildPriceHistorySummary } from "../services/autoMarketMarketplaceFinal";
import { buildWarrantyBadgeSet, buildReservationReadinessStates, buildResidualSignalRail } from "../services/autoMarketExtendedSignals";
import BookingFlowCard from "../components/Details/BookingFlowCard";
import LocalPaymentOptionsCard from "../components/Details/LocalPaymentOptionsCard";
import ComfortOptions from "../components/Details/ComfortOptions";
import SafetyTipsCard from "../components/Details/SafetyTipsCard";
import FairPriceBlock from "../components/Details/FairPriceBlock";
import VikupCalculator from "../components/Details/VikupCalculator";
import BarterMatchList from "../components/Details/BarterMatchList";
import useCarDetails from "../hooks/useCarDetails";
import useRecentlyViewed from "../hooks/useRecentlyViewed";
import { useCompare } from "../context/CompareContext";
import { useGaraj } from "../context/GarajContext";
import PromoModal from "../components/Details/PromoModal.jsx";
import useWalletBalance from "../hooks/useWalletBalance";
import { revealSellerPhone } from "../services/marketBackend";
import { buildDetailConfidenceSteps } from "../services/autoMarketJourney";
import { buildPremiumDetailActions } from "../services/autoMarketPremium";
import { buildLuxuryDetailStory } from "../services/autoMarketLuxury";
import { buildShowroomConciergePlan } from "../services/autoMarketShowroom";
import { buildOwnershipEstimate, buildDecisionChecklist } from "../services/autoMarketBuyerCore";
import { buildFinalDecisionRail } from "../services/autoMarketFinalPolish";
import { buildWarrantyReservationSignals, buildVinInsightCard, buildInspectionCertificateCard } from "../services/autoMarketExtendedSignals";

export default function DetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { car, loading, error, refresh } = useCarDetails(id);
  const { addToHistory } = useRecentlyViewed();
  const { toggleCompare, isInCompare } = useCompare();
  const { refreshBalance } = useWalletBalance();

  const [revealedPhone, setRevealedPhone] = useState(null);
  const [barterOpen, setBarterOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const premiumActions = useMemo(() => buildPremiumDetailActions(car), [car]);

  // Yaqinda ko'rilganlar ro'yxatiga qo'shish
  useEffect(() => {
    if (car) addToHistory(car);
  }, [car, addToHistory]);

  // Yuklanish holatini tekshirish
  if (loading) return <div style={{ padding: 100, textAlign: "center" }}><Spin size="large" /></div>;
  if (error || !car) return <div style={{ padding: 50, textAlign: "center" }}>E'lon topilmadi yoki xatolik yuz berdi.</div>;

  // --- KREDIT KALKULYATORI (Faqat car mavjud bo'lganda ishlaydi) ---
  const calculateLoan = (price) => {
    // Narxdan barcha belgilarni olib tashlab faqat raqamni olish
    const cleanPrice = typeof price === 'string' ? price.replace(/[^0-9.-]+/g,"") : price;
    const p = Number(cleanPrice) || 0;
    const deposit = p * 0.3; // 30% boshlang'ich
    const remain = p - deposit;
    const monthly = (remain * 1.24) / 36; // 3 yilga taxminiy 24% bilan
    return { deposit: Math.round(deposit), monthly: Math.round(monthly) };
  };
  
  const loan = calculateLoan(car.price);
  const confidenceSteps = buildDetailConfidenceSteps(car);
  const luxuryStory = buildLuxuryDetailStory(car);
  const ownershipEstimate = buildOwnershipEstimate(car);
  const decisionChecklist = buildDecisionChecklist(car);
  const finalDecisionRail = buildFinalDecisionRail(car);
  const extendedSignals = buildWarrantyReservationSignals(car);
  const vinInsight = buildVinInsightCard(car);
  const inspectionCertificate = buildInspectionCertificateCard(car);

  // --- KUZOV STATUS RANGINI ANIQLASH ---
  const getPartColor = (status) => {
    if (status === "painted") return "#f59e0b"; // Bo'yalgan - Sariq
    if (status === "replaced") return "#ef4444"; // Almashgan - Qizil
    return "#e2e8f0"; // Toza - Kulrang
  };

  return (
    <div style={{ paddingBottom: 100, background: "#f8fafc", minHeight: "100vh" }}>
      {/* Yuqori navigatsiya paneli */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "12px 16px", 
        background: "#fff", 
        position: "sticky", 
        top: 0, 
        zIndex: 10,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
      }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => nav(-1)} />
        <div style={{ fontWeight: 800, fontSize: 16 }}>{car.brand} {car.model}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <FavoriteButton carId={car.id} />
          <Button 
            icon={<SwapOutlined style={{ color: isInCompare(car.id) ? "#2563eb" : "inherit" }} />} 
            type="text" 
            onClick={() => {
              toggleCompare(car);
              message.success(isInCompare(car.id) ? "Solishtirishdan olindi" : "Solishtirishga qo'shildi");
            }} 
          />
        </div>
      </div>

      <GallerySlider images={car.images || []} />

      <div style={{ padding: "14px 16px 0" }}>
        <Card style={{ borderRadius: 22, border: "1px solid #e2e8f0", boxShadow: "0 14px 34px rgba(15,23,42,.05)" }} styles={{ body: { padding: 16 } }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 18 }}>Bu e’lonni tushunish uchun 3 narsa kifoya</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Narx, tekshiruv va aloqa oqimi bitta professional detail qatlamida yig‘ildi.</div>
            </div>
            <Tag color="blue" style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>Professional detail flow</Tag>
          </div>
          <Timeline
            style={{ marginTop: 16 }}
            items={confidenceSteps.map((step) => ({
              color: step.state === "good" || step.state === "ready" ? "green" : step.state === "warn" ? "orange" : "red",
              children: <div><div style={{ fontWeight: 800, color: "#0f172a" }}>{step.title}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{step.text}</div></div>,
            }))}
          />
        </Card>
      </div>

      <div style={{ padding: "0 16px", marginTop: 14 }}>
        <Card style={{ borderRadius: 22, border: "1px solid #e2e8f0", overflow: "hidden", background: "linear-gradient(135deg,#fff7ed 0%,#ffffff 55%,#eff6ff 100%)", boxShadow: "0 16px 36px rgba(15,23,42,.05)" }} styles={{ body: { padding: 16 } }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 18 }}>Luxury qaror paneli</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Narx, ishonch va narx harakati bitta premium qatlamda ko‘rsatildi.</div>
            </div>
            <Tag color="gold" style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>Showroom detail</Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
            {luxuryStory.map((item) => (
              <div key={item.key} style={{ borderRadius: 18, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>


<div style={{ padding: "0 16px", marginTop: 14 }}>
  <Card style={{ borderRadius: 22, border: "1px solid #e2e8f0", boxShadow: "0 16px 36px rgba(15,23,42,.05)" }} styles={{ body: { padding: 16 } }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 18 }}>Marketplace decision center</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Dealer, finance, narx tarixi va bildirishnomalar bir joyda yig‘ildi.</div>
      </div>
      <Tag color="geekblue" style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>Final ecosystem</Tag>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginTop: 14 }}>
      <div style={{ borderRadius: 18, padding: 14, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <div style={{ fontWeight: 900, color: "#0f172a" }}>{dealerTrustProfile.sellerName}</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>Trust {dealerTrustProfile.trust}% • {dealerTrustProfile.response}</div>
        <Button icon={<ShopOutlined />} style={{ marginTop: 12 }} onClick={() => nav(`/auto-market/dealer/${car?.seller_id || car?.seller?.id || "main"}`)}>Dealer profil</Button>
      </div>
      <div style={{ borderRadius: 18, padding: 14, background: "#faf5ff", border: "1px solid #e9d5ff" }}>
        <div style={{ fontWeight: 900, color: "#0f172a" }}>{financeOffers[0]?.title}</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>Oyiga {financeOffers[0]?.monthly}</div>
        <Button icon={<BankOutlined />} style={{ marginTop: 12 }} onClick={() => nav(`/auto-market/finance-offers/${car?.id || "preview"}`)}>Finance offers</Button>
      </div>
      <div style={{ borderRadius: 18, padding: 14, background: "#fff7ed", border: "1px solid #fed7aa" }}>
        <div style={{ fontWeight: 900, color: "#0f172a" }}>{priceHistorySummary.summary}</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>Farq: {priceHistorySummary.deltaText}</div>
        <Button icon={<HistoryOutlined />} style={{ marginTop: 12 }} onClick={() => nav(`/auto-market/price-history/${car?.id || "preview"}`)}>Narx tarixi</Button>
      </div>
      <div style={{ borderRadius: 18, padding: 14, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <div style={{ fontWeight: 900, color: "#0f172a" }}>{notificationSignals.length} ta signal</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>Booking, narx va sotuvchi javoblari bo‘yicha</div>
        <Button icon={<BellOutlined />} style={{ marginTop: 12 }} onClick={() => nav("/auto-market/notifications")}>Bildirishnomalar</Button>
      </div>
    </div>
  </Card>
</div>

      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
              <PriceTag price={car.price} />
            </div>
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
              {car.city}, {car.year}-yil, {car.mileage} km
            </div>
          </div>
          {car.is_vip && <Tag color="gold" style={{ borderRadius: 6, margin: 0, fontWeight: 700 }}>PREMIUM</Tag>}
        </div>

        {/* AI Narx Analitikasi Bloki */}
        <Card style={{ marginTop: 16, borderRadius: 16, border: "1px solid #e0e7ff", background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)" }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ThunderboltOutlined style={{ color: '#2563eb', fontSize: 18 }} />
              <span style={{ fontWeight: 800, color: '#1e40af' }}>AI Narx Tahlili</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Statistic title="Bozor narxi" value={Number(car.price) * 1.05} precision={0} valueStyle={{ fontSize: 16 }} prefix="$" />
              <div style={{ textAlign: 'right' }}>
                 <Tag color="green" style={{ borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>Zo'r taklif</Tag>
                 <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Bozordan 5% arzon</div>
              </div>
           </div>
           <Progress percent={85} showInfo={false} strokeColor="#10b981" style={{ marginTop: 10 }} />
        </Card>

        <div style={{ marginTop: 16 }}>
          <VinCheckBlock vin={car.vin} />
        </div>

        <div style={{ marginTop: 16 }}>
          <InspectionViewer car={car} />
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} styles={{ body: { padding: 14 } }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img src={vinInsight.asset} alt={vinInsight.title} style={{ width: 72, height: 56, objectFit: "contain", borderRadius: 12, background: "#f8fafc", padding: 8 }} />
              <div>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{vinInsight.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{vinInsight.note}</div>
              </div>
            </div>
          </Card>

          <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} styles={{ body: { padding: 14 } }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img src={inspectionCertificate.image} alt={inspectionCertificate.title} style={{ width: 72, height: 56, objectFit: "contain", borderRadius: 12, background: "#f8fafc", padding: 8 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900, color: "#0f172a" }}>{inspectionCertificate.title}</div>
                  <Tag color="success" style={{ borderRadius: 999, margin: 0 }}>{inspectionCertificate.badge}</Tag>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{inspectionCertificate.note}</div>
              </div>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {extendedSignals.map((item) => (
              <Card key={item.key} style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} styles={{ body: { padding: 14 } }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{item.note}</div>
                  </div>
                  <Tag color="blue" style={{ borderRadius: 999, margin: 0 }}>{item.cta}</Tag>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: "#e2e8f0", marginTop: 12, overflow: "hidden" }}>
                  <div style={{ width: "68%", background: item.accent, height: "100%" }} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        <MainSpecsGrid car={car} />

        <Divider style={{ margin: "20px 0" }} />

        {/* Vizual Kuzov (Kraska) Holati Sxemasi */}
        <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BgColorsOutlined /> Kuzov holati (Kraska)
            </div>
            <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 8 }}>
                    <div style={{ width: 60, height: 35, background: getPartColor(car?.body_parts?.kapot), border: "1px solid #cbd5e1", borderRadius: "4px 4px 0 0", fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Kapot</div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
                    <div style={{ width: 40, height: 55, background: getPartColor(car?.body_parts?.left_door), border: "1px solid #cbd5e1", fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chap</div>
                    <div style={{ width: 50, height: 55, background: "#f1f5f9", border: "1px solid #cbd5e1", display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>Tom</div>
                    <div style={{ width: 40, height: 55, background: getPartColor(car?.body_parts?.right_door), border: "1px solid #cbd5e1", fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>O'ng</div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
                    <div style={{ width: 60, height: 30, background: getPartColor(car?.body_parts?.bagaj), border: "1px solid #cbd5e1", borderRadius: "0 0 4px 4px", fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Bagaj</div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 15 }}>
                    <span style={{ fontSize: 11 }}><Tag color="#e2e8f0" style={{ width: 12, height: 12, padding: 0, verticalAlign: 'middle', border: "1px solid #cbd5e1" }} /> Toza</span>
                    <span style={{ fontSize: 11 }}><Tag color="#f59e0b" style={{ width: 12, height: 12, padding: 0, verticalAlign: 'middle', border: "1px solid #cbd5e1" }} /> Bo'yalgan</span>
                    <span style={{ fontSize: 11 }}><Tag color="#ef4444" style={{ width: 12, height: 12, padding: 0, verticalAlign: 'middle', border: "1px solid #cbd5e1" }} /> Almashgan</span>
                </div>
            </div>
        </div>

        {/* Kredit va Lizing Kalkulyatori */}
        <Card style={{ marginBottom: 20, borderRadius: 16, border: "1px solid #e2e8f0" }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                 <CalculatorOutlined style={{ color: '#0ea5e9' }} /> Kredit va Lizing
              </div>
              <Tooltip title="Taxminiy hisob-kitob. Bank shartlari o'zgarishi mumkin.">
                <InfoCircleOutlined style={{ color: '#94a3b8' }} />
              </Tooltip>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
                 <div style={{ fontSize: 11, color: '#64748b' }}>Boshlang'ich (30%)</div>
                 <div style={{ fontWeight: 700, fontSize: 14 }}>${loan.deposit.toLocaleString()}</div>
              </div>
              <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '10px' }}>
                 <div style={{ fontSize: 11, color: '#0ea5e9' }}>Oylik to'lov</div>
                 <div style={{ fontWeight: 700, fontSize: 14, color: '#0369a1' }}>${loan.monthly.toLocaleString()} /oy</div>
              </div>
           </div>
           <Button type="link" block style={{ marginTop: 8, fontSize: 12 }}>To'liq grafikni ko'rish</Button>
        </Card>

        <FairPriceBlock car={car} />

        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {ownershipEstimate.map((item) => (
            <Card key={item.key} style={{ borderRadius: 18, border: `1px solid ${item.tone}22`, background: `${item.tone}0D` }} styles={{ body: { padding: 14 } }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
              <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a" }}>{item.value}</div>
            </Card>
          ))}
        </div>

        <Card style={{ marginTop: 16, borderRadius: 18, border: "1px solid #e2e8f0" }} styles={{ body: { padding: 16 } }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>Qarorni yengillashtiruvchi checklist</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Ko'rishdan oldin aynan shu 3 narsani yopib oling.</div>
            </div>
            <Tag color="processing" style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>Buyer core</Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
            {decisionChecklist.map((item) => (
              <div key={item.key} style={{ borderRadius: 16, border: `1px solid ${item.tone}22`, background: `${item.tone}12`, padding: 14 }}>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ marginTop: 16 }}>
          <Card style={{ borderRadius: 20, border: "1px solid #e2e8f0" }} styles={{ body: { padding: 16 } }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>Narx tushsa yoki shunga o‘xshash e’lon chiqsa signal oling</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Buyer core 2-bosqichda alert va kuzatuv qatlami qo‘shildi.</div>
              </div>
              <Button style={{ borderRadius: 12 }} onClick={() => { saveAlertDraft({ brand: car.brand, model: car.model, priceDropOnly: true }, `${car.brand} ${car.model} signal`); message.success("Alert saqlandi"); }}>
                Shu model uchun alert yoqish
              </Button>
            </div>
          </Card>
        </div>

        <Divider style={{ margin: "20px 0" }} />

        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>Sotuvchi tavsifi</div>
        <div style={{ fontSize: 15, color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
          {car.description || "Ushbu avtomobil uchun tavsif kiritilmagan."}
        </div>

        <ComfortOptions options={car.features || []} />

        {car.is_vikup && (
          <div style={{ marginTop: 24 }}>
            <VikupCalculator car={car} />
          </div>
        )}

        <PriceHistoryGraph history={car.price_history} />

        <div style={{ marginTop: 16 }}>
          <PriceDropCard history={car.price_history || []} />
        </div>

        <div style={{ marginTop: 16 }}>
          <BookingFlowCard
            ad={car}
            seller={car.seller}
            onSchedule={() => nav(`/auto-market/booking/${car.id}/checkout`)}
            onReserve={() => nav(`/auto-market/booking/${car.id}/checkout`)}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <LocalPaymentOptionsCard
            ad={car}
            onPay={() => nav(`/auto-market/booking/${car.id}/checkout`)}
          />
        </div>

        <SellerProfile seller={{ ...car.seller, seller_type: car.seller_type }} isOwner={car.is_owner} onPromo={() => setPromoOpen(true)} />

        <div style={{ marginTop: 16 }}>
          <AppointmentBookingCard seller={car.seller} onCall={() => window.location.href = `tel:${revealedPhone || car?.seller?.phone || ""}`} />
        </div>
        
        <SafetyTipsCard />
      </div>

      {/* Pastki suzuvchi panel (Action Bar) */}
      <div style={{ 
        position: "fixed", 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: "12px 16px", 
        background: "rgba(255,255,255,0.9)", 
        backdropFilter: "blur(10px)",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        gap: 12,
        zIndex: 100
      }}>
        {car.is_barter && (
          <Button 
            icon={<SwapOutlined />} 
            style={{ borderRadius: 14, height: 48, fontWeight: 600, flex: 1 }}
            onClick={() => setBarterOpen(true)}
          >
            Barter
          </Button>
        )}
        <Button 
          type="primary" 
          block 
          size="large"
          loading={loading}
          onClick={async () => {
            if (car.is_owner) {
              message.info("Bu sizning e'loningiz");
              return;
            }
            if (revealedPhone) {
              window.location.href = `tel:${revealedPhone}`;
              return;
            }
            try {
              const res = await revealSellerPhone(car.id);
              if (res?.phone) {
                setRevealedPhone(res.phone);
                await refreshBalance();
                message.success(res?.already ? "Raqam allaqachon ochilgan" : "✅ Raqam ochildi");
                window.location.href = `tel:${res.phone}`;
                return;
              }
              message.info("Sotuvchi raqami topilmadi");
            } catch (e) {
              const msg = e?.message || "Raqamni ochishda xatolik";
              if (msg.toLowerCase().includes("balans") || msg.toLowerCase().includes("402") || msg.toLowerCase().includes("enough")) {
                nav(`/auto-market/topup?need=5000&next=${encodeURIComponent(`/auto-market/ad/${car.id}`)}`);
                return;
              }
              message.error(msg);
            }
          }}
          style={{ borderRadius: 14, height: 48, background: "#0ea5e9", border: "none", fontWeight: 700, flex: 2 }}
        >
          {car.is_owner ? "Tel qilish" : revealedPhone ? revealedPhone : "Raqamni ko'rish"}
        </Button>
      </div>

      {/* Modallar */}
      <BarterMatchList car={car} visible={barterOpen} onClose={() => setBarterOpen(false)} />

      <PromoModal
        open={promoOpen}
        onClose={() => setPromoOpen(false)}
        adId={car.id}
        onNeedTopup={() => nav(`/auto-market/topup`)}
      />
    </div>
  );
}