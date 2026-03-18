/**
 * FeedPage
 * Asl funksionallik to'liq saqlangan.
 * YANGI: Lentada har 5 ta kartadan keyin SponsoredCarCard ko'rinadi.
 * YANGI QO'SHILDI: AI Recommendations, QuickView Modal, Trend Chips, Floating Add Button.
 */
import React, { useMemo, useState } from "react";
import { Button, Input, Spin, Modal, Tag, Empty, Badge, Card, message } from "antd";
import { 
  PlusOutlined, 
  FilterOutlined, 
  ThunderboltOutlined, 
  FireOutlined, 
  EyeOutlined,
  SearchOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import StoriesRail from "../components/Feed/StoriesRail";
import SmartFilterBar from "../components/Feed/SmartFilterBar";
import MarketEntryGuide from "../components/Feed/MarketEntryGuide";
import QuickNavPanel from "../components/Feed/QuickNavPanel";
import CarCardVertical from "../components/Feed/CarCardVertical";
import SponsoredCarCard, { DEFAULT_SPONSORS } from "../components/Feed/SponsoredCarCard";
import CompareFloatBtn from "../components/Feed/CompareFloatBtn";
import SortDropdown from "../components/Feed/SortDropdown";
import FullFilterDrawer from "../components/Filters/FullFilterDrawer";
import useCarList from "../hooks/useCarList";
import { useMarket } from "../context/MarketContext";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";
import { buildFeedJourneyCards, buildFeedShortcuts, buildBodyTypeEducation } from "../services/autoMarketJourney";
import { buildPremiumFeedSignals } from "../services/autoMarketPremium";
import { buildLuxuryFeedShowcase } from "../services/autoMarketLuxury";
import { buildShowroomConciergeDeck } from "../services/autoMarketShowroom";
import { saveSearchDraft, listSavedSearches, buildBudgetBrowseCards, buildNoResultRescue, buildSavedSearchInsights, buildScenarioBrowseCards, listSavedAlerts, saveAlertDraft, buildSavedAlertInsights } from "../services/autoMarketBuyerCore";
import { buildMarketplaceHubCards } from "../services/autoMarketFinalPolish";
import { buildExtendedBrowseCards } from "../services/autoMarketExtendedSignals";

const SPONSOR_EVERY = 5; // har nechta kartadan keyin sponsor

export default function FeedPage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState(null); // Quick View uchun state
  
  const { filters, patchFilters } = useMarket();
  const { items, loading, error, page, pageCount, go } = useCarList(filters, { pageSize: 12 });

  const journeyCards = useMemo(() => buildFeedJourneyCards(filters), [filters]);
  const shortcutCards = useMemo(() => buildFeedShortcuts(), []);
  const bodyEducation = useMemo(() => buildBodyTypeEducation(), []);
  const luxuryShowcase = useMemo(() => buildLuxuryFeedShowcase(items, filters), [items, filters]);
  const conciergeDeck = useMemo(() => buildShowroomConciergeDeck(items, filters), [items, filters]);
  const budgetBrowseCards = useMemo(() => buildBudgetBrowseCards(), []);
  const scenarioBrowseCards = useMemo(() => buildScenarioBrowseCards(), []);
  const rescueHints = useMemo(() => buildNoResultRescue(filters), [filters]);
  const savedSearchInsights = useMemo(() => buildSavedSearchInsights(listSavedSearches(), filters), [filters]);
  const savedAlertInsights = useMemo(() => buildSavedAlertInsights(listSavedAlerts(), filters), [filters]);
  const marketplaceHubCards = useMemo(() => buildMarketplaceHubCards(), []);
  const extendedBrowseCards = useMemo(() => buildExtendedBrowseCards(), []);

  const renderItems = () => {
    if (!items?.length && !loading) return (
      <Card style={{ borderRadius: 22, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 18 }}>
        <Empty description="E'lonlar topilmadi" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {rescueHints.map((item) => (
            <Tag key={item.key} style={{ borderRadius: 999, cursor: "pointer" }} onClick={() => patchFilters(item.patch)}>{item.title}</Tag>
          ))}
        </div>
      </Card>
    );
    
    const result = [];
    items.forEach((item, idx) => {
      // Asl e'lon kartochkasi (QuickView funksiyasi qo'shildi)
      result.push(
        <div key={item?.id ?? `item-${idx}`} style={{ position: 'relative' }}>
          <CarCardVertical 
            ad={item} 
            onClick={() => item?.id && nav(`/auto-market/ad/${item.id}`)} 
          />
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            style={{ 
              position: 'absolute', 
              top: 10, 
              right: 10, 
              borderRadius: 8, 
              background: 'rgba(255,255,255,0.8)',
              border: 'none',
              backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewItem(item);
            }}
          />
        </div>
      );

      // Har SPONSOR_EVERY tadan keyin homiy e'lonini qo'shish (Asl mantiq)
      if ((idx + 1) % SPONSOR_EVERY === 0) {
        const sIdx = Math.floor(idx / SPONSOR_EVERY) % DEFAULT_SPONSORS.length;
        result.push(<SponsoredCarCard key={`sponsor-${idx}`} sponsor={DEFAULT_SPONSORS[sIdx]} />);
      }
    });
    return result;
  };

  return (
    <div style={{ paddingBottom: 80, background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header Section */}
      <div style={{ padding: "14px 16px", background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={filters.q}
            onChange={(e) => patchFilters({ q: e.target.value })}
            placeholder={am("feed.searchPlaceholder")}
            style={{ borderRadius: 14, height: 42, background: '#f1f5f9', border: 'none' }}
          />
          <Badge dot={Object.keys(filters).length > 1}>
            <Button 
                icon={<FilterOutlined />} 
                onClick={() => setDrawer(true)} 
                style={{ borderRadius: 14, height: 42, width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            />
          </Badge>
          <SortDropdown />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <Button size="small" style={{ borderRadius: 999 }} onClick={() => { saveSearchDraft(filters); message.success("Qidiruv saqlandi"); }}>Qidiruvni saqlash</Button>
          <Button size="small" style={{ borderRadius: 999 }} onClick={() => { saveAlertDraft(filters); message.success("Alert saqlandi"); }}>Alert yoqish</Button>
          <Button size="small" style={{ borderRadius: 999 }} onClick={() => nav("/auto-market/saved-searches")}>Saqlangan qidiruvlar</Button>
          <Button size="small" style={{ borderRadius: 999 }} onClick={() => nav("/auto-market/saved-alerts")}>Saqlangan alertlar</Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginTop: 12 }}>
          {savedSearchInsights.concat(savedAlertInsights).map((item) => (
            <div key={item.key} style={{ borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0", padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{item.label}</div>
              <div style={{ marginTop: 6, fontWeight: 900, color: "#0f172a" }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 12 }}>
          {marketplaceHubCards.slice(0, 2).map((item) => (
            <div key={item.key} onClick={() => nav(item.route)} style={{ borderRadius: 16, background: `${item.tone}10`, border: `1px solid ${item.tone}22`, padding: 12, cursor: "pointer" }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{item.title}</div>
              <div style={{ marginTop: 6, fontWeight: 900, color: "#0f172a" }}>{item.action}</div>
            </div>
          ))}
        </div>


        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginTop: 12 }}>
          {extendedBrowseCards.map((item) => (
            <div key={item.key} style={{ borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0", padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <img src={item.asset} alt={item.title} style={{ width: 66, height: 44, objectFit: "contain", borderRadius: 12, background: "#f8fafc", padding: 6 }} />
              <div>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{item.note}</div>
              </div>
            </div>
          ))}
        </div>


        {/* YANGI: Trend Chips (Tezkor filtrlar) */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
           <Tag 
            icon={<FireOutlined />} 
            color="volcano" 
            style={{ borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}
            onClick={() => patchFilters({ sort: 'price_asc' })}
           >
             Arzonlari
           </Tag>
           <Tag 
            icon={<ThunderboltOutlined />} 
            color="blue" 
            style={{ borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}
            onClick={() => patchFilters({ fuel_type: 'Elektro' })}
           >
             Elektromobillar
           </Tag>
           <Tag 
            style={{ borderRadius: 20, padding: '4px 12px', cursor: 'pointer', background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}
            onClick={() => patchFilters({ yearFrom: 2023 })}
           >
             Yangi (2023+)
           </Tag>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <Button style={{ borderRadius: 999 }} onClick={() => { saveSearchDraft(filters); message.success("Qidiruv saqlandi"); }}>
            Qidiruvni saqlash
          </Button>
          <Button style={{ borderRadius: 999 }} onClick={() => nav("/auto-market/saved-searches")}>
            Saqlangan qidiruvlar
          </Button>
          {savedSearchInsights.map((item) => (
            <span key={item.key} style={{ padding: "7px 10px", borderRadius: 999, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 700, color: "#475569" }}>
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      </div>

      <StoriesRail />
      
      {/* YANGI: AI Recommendation Banner */}
      <div style={{ padding: '0 16px', marginTop: 16 }}>
        <div style={{ 
            background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)', 
            borderRadius: 16, 
            padding: '16px', 
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>Siz uchun AI tanlovi</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>Qidiruvlaringiz asosida eng mos variantlar</div>
            </div>
            <ThunderboltOutlined style={{ fontSize: 32, opacity: 0.3 }} />
        </div>
      </div>


      <QuickNavPanel />

      <div style={{ padding: "0 16px", marginTop: 16 }}>
        <div style={{ borderRadius: 28, padding: 20, background: "linear-gradient(135deg,#111827 0%,#0f172a 36%,#1d4ed8 100%)", color: "#fff", boxShadow: "0 24px 60px rgba(15,23,42,.26)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ maxWidth: 720 }}>
              <div style={{ fontSize: 24, fontWeight: 950 }}>{luxuryShowcase.headline}</div>
              <div style={{ marginTop: 8, color: "rgba(255,255,255,.78)", lineHeight: 1.55 }}>{luxuryShowcase.subline}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {luxuryShowcase.concierge.map((item) => (
                  <span key={item} style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.14)", fontSize: 12, fontWeight: 700 }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <Tag color="gold" style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>Luxury experience</Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 16 }}>
            {luxuryShowcase.metrics.map((metric) => (
              <div key={metric.key} style={{ borderRadius: 18, padding: 14, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.72)" }}>{metric.label}</div>
                <div style={{ marginTop: 8, fontWeight: 950, fontSize: 22 }}>{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 14, borderRadius: 24, padding: 18, background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "#fff", boxShadow: "0 18px 44px rgba(15,23,42,.22)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 950 }}>Premium auto bozor</div>
            <div style={{ marginTop: 6, color: "rgba(255,255,255,.75)", maxWidth: 720 }}>
              Qidiruv, ishonch, narx va aloqa bir joyda bo'lsin degan foydalanuvchi uchun soddalashtirilgan oqim.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              "Tekshiruvli e'lonlar",
              "Narxi tushgan mashinalar",
              "Tez javob beradigan sotuvchilar",
            ].map((item) => (
              <span key={item} style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.16)", fontSize: 12, fontWeight: 700 }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <MarketEntryGuide />

<div style={{ padding: "0 16px", marginTop: 14 }}>
  <Card className="final-marketplace-shortcuts" style={{ borderRadius: 24, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 18 }}>Marketplace center</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Qidiruvdan tashqari finance, notifications va dealer sahifalariga tez kirish.</div>
      </div>
      <Tag color="purple" style={{ borderRadius: 999, margin: 0 }}>Final layer</Tag>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginTop: 14 }}>
      {[
        { key: "alerts", title: "Alerts", text: "Narx, booking va seller javoblari", href: "/auto-market/notifications" },
        { key: "finance", title: "Finance", text: "Mahalliy to‘lov va bo‘lib to‘lash", href: "/auto-market/finance-offers/showcase" },
        { key: "dealer", title: "Dealer", text: "Showroom va ishonch profili", href: "/auto-market/dealer/main" },
      ].map((item) => (
        <div key={item.key} style={{ borderRadius: 18, padding: 14, border: "1px solid #e2e8f0", background: "#fff" }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{item.text}</div>
          <Button style={{ marginTop: 12 }} onClick={() => nav(item.href)}>Ochish</Button>
        </div>
      ))}
    </div>
  </Card>
</div>

      <div style={{ padding: "0 16px", marginTop: 14 }}
        <Card style={{ borderRadius: 22, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>Budjet va vazifa bo'yicha tez tanlov</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Bir qarashda qaysi segmentdan boshlashni ko'rsatadi.</div>
            </div>
            <Tag color="purple" style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>Buyer core</Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
            {budgetBrowseCards.map((card) => (
              <div key={card.key} onClick={() => patchFilters(card.patch)} style={{ borderRadius: 18, border: `1px solid ${card.tone}22`, background: `${card.tone}10`, padding: 14, cursor: "pointer" }}>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{card.title}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.45 }}>{card.text}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div style={{ padding: "0 16px", marginTop: 14, display: "grid", gap: 12 }}>
        <Card style={{ borderRadius: 22, border: "1px solid #e2e8f0", boxShadow: "0 14px 34px rgba(15,23,42,.05)" }} bodyStyle={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 18 }}>Qayerdan boshlashni o‘ylab o‘tirmang</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Qidiruv, ishonch tekshiruvi va bog‘lanish oqimi bir ko‘rinishda berildi.</div>
            </div>
            <Tag color="blue" style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>Yangi professional bozor oqimi</Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10, marginTop: 14 }}>
            {journeyCards.map((card) => (
              <div key={card.key} style={{ borderRadius: 18, border: `1px solid ${card.tone}22`, background: `${card.tone}0D`, padding: 14 }}>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{card.title}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.45 }}>{card.text}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {shortcutCards.map((item) => (
              <Button key={item.key} size="small" style={{ borderRadius: 999, height: 34 }} onClick={() => patchFilters(item.patch)}>{item.label}</Button>
            ))}
          </div>
        </Card>

        <Card style={{ borderRadius: 22, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>Body type guide</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Kuzov turini bir qarashda ajratish uchun vizual yordam.</div>
            </div>
            <Tag color="cyan" style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>Tushunarli browse</Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 10, marginTop: 14 }}>
            {bodyEducation.map((item) => (
              <div key={item.key} style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff", padding: 12, textAlign: "center" }}>
                <img src={item.asset} alt={item.title} style={{ width: 48, height: 30, objectFit: "contain" }} />
                <div style={{ fontSize: 11, fontWeight: 800, color: "#334155", marginTop: 8 }}>{item.title}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <SmartFilterBar />

      <div style={{ padding: "12px 14px" }}>
        {loading && page === 1 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 50 }}><Spin size="large" /></div>
        ) : error ? (
          <div style={{ color: "#ef4444", fontWeight: 800, textAlign: 'center', padding: 20 }}>{error}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {renderItems()}
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, alignItems: 'center' }}>
            <Button disabled={page <= 1} onClick={() => go(page - 1)} style={{ borderRadius: 12, height: 40 }}>
              {am("app.previous")}
            </Button>
            <div style={{ fontWeight: 800, color: "#64748b", background: '#fff', padding: '6px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                {page} / {pageCount}
            </div>
            <Button disabled={page >= pageCount} onClick={() => go(page + 1)} style={{ borderRadius: 12, height: 40 }}>
              {am("app.next")}
            </Button>
          </div>
        )}
      </div>

      {/* Floating Add Button (Zamonaviy FAB) */}
      <Button
        type="primary"
        shape="circle"
        icon={<PlusOutlined style={{ fontSize: 24 }} />}
        onClick={() => nav("/auto-market/create")}
        style={{
          position: "fixed",
          bottom: 90,
          right: 20,
          width: 60,
          height: 60,
          boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)",
          background: "#2563eb",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}
      />

      <CompareFloatBtn />

      <FullFilterDrawer open={drawer} onClose={() => setDrawer(false)} />

      {/* YANGI: Quick View Modal */}
      <Modal
        open={!!quickViewItem}
        onCancel={() => setQuickViewItem(null)}
        footer={null}
        centered
        width={350}
        bodyStyle={{ padding: 0 }}
        closable={false}
      >
        {quickViewItem && (
          <div style={{ borderRadius: 20, overflow: 'hidden' }}>
            <img 
              src={quickViewItem.images?.[0]} 
              style={{ width: '100%', height: 200, objectFit: 'cover' }} 
              alt="car"
            />
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{quickViewItem.brand} {quickViewItem.model}</div>
              <div style={{ color: '#2563eb', fontWeight: 800, fontSize: 20, marginTop: 4 }}>
                ${quickViewItem.price?.toLocaleString()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px', fontSize: 12 }}>
                  📅 {quickViewItem.year} yil
                </div>
                <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px', fontSize: 12 }}>
                  🛣️ {quickViewItem.mileage} km
                </div>
              </div>
              <Button 
                type="primary" 
                block 
                style={{ marginTop: 16, borderRadius: 12, height: 40, background: '#2563eb' }}
                onClick={() => {
                   setQuickViewItem(null);
                   nav(`/auto-market/ad/${quickViewItem.id}`);
                }}
              >
                To'liq ko'rish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}