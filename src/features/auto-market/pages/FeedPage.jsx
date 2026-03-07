/**
 * FeedPage
 * Asl funksionallik to'liq saqlangan.
 * YANGI: Lentada har 5 ta kartadan keyin SponsoredCarCard ko'rinadi.
 * YANGI QO'SHILDI: AI Recommendations, QuickView Modal, Trend Chips, Floating Add Button.
 */
import React, { useState } from "react";
import { Button, Input, Spin, Modal, Tag, Empty, Badge } from "antd";
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
import QuickNavPanel from "../components/Feed/QuickNavPanel";
import CarCardVertical from "../components/Feed/CarCardVertical";
import SponsoredCarCard, { DEFAULT_SPONSORS } from "../components/Feed/SponsoredCarCard";
import CompareFloatBtn from "../components/Feed/CompareFloatBtn";
import SortDropdown from "../components/Feed/SortDropdown";
import FullFilterDrawer from "../components/Filters/FullFilterDrawer";
import useCarList from "../hooks/useCarList";
import { useMarket } from "../context/MarketContext";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";

const SPONSOR_EVERY = 5; // har nechta kartadan keyin sponsor

export default function FeedPage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState(null); // Quick View uchun state
  
  const { filters, patchFilters } = useMarket();
  const { items, loading, error, page, pageCount, go } = useCarList(filters, { pageSize: 12 });

  const renderItems = () => {
    if (!items?.length && !loading) return <Empty description="E'lonlar topilmadi" />;
    
    const result = [];
    items.forEach((item, idx) => {
      // Asl e'lon kartochkasi (QuickView funksiyasi qo'shildi)
      result.push(
        <div key={item.id} style={{ position: 'relative' }}>
          <CarCardVertical 
            car={item} 
            onClick={() => nav(`/auto-market/ad/${item.id}`)} 
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
            onClick={() => patchFilters({ year_from: 2023 })}
           >
             Yangi (2023+)
           </Tag>
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