/**
 * FeedPage
 * Asl funksionallik to'liq saqlangan.
 * YANGI: Lentada har 5 ta kartadan keyin SponsoredCarCard ko'rinadi.
 */
import React, { useState } from "react";
import { Button, Input, Spin } from "antd";
import { PlusOutlined, FilterOutlined } from "@ant-design/icons";
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
  const { filters, patchFilters } = useMarket();
  const { items, loading, error, page, pageCount, go } = useCarList(filters, { pageSize: 12 });

  // Sponsor indeksini sahifa bo'yicha aylantirish
  const sponsorIdx = (page - 1) % DEFAULT_SPONSORS.length;

  // Kartalar orasiga sponsor qo'shish
  const renderItems = () => {
    const result = [];
    items.forEach((ad, i) => {
      result.push(
        <CarCardVertical
          key={ad.id}
          ad={ad}
          onClick={() => nav(`/auto-market/ad/${ad.id}`)}
        />
      );
      // Har SPONSOR_EVERY kartadan keyin bitta sponsor
      if ((i + 1) % SPONSOR_EVERY === 0 && i < items.length - 1) {
        const sp = DEFAULT_SPONSORS[(sponsorIdx + Math.floor(i / SPONSOR_EVERY)) % DEFAULT_SPONSORS.length];
        result.push(
          <SponsoredCarCard
            key={`sponsor_${i}`}
            sponsor={sp}
          />
        );
      }
    });
    return result;
  };

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ position:"sticky", top:0, zIndex: 50, background:"#ffffffcc", backdropFilter:"blur(10px)", borderBottom:"1px solid #e2e8f0" }}>
        <div style={{ padding: "12px 14px", display:"flex", gap: 10, alignItems:"center" }}>
          <div style={{ fontWeight: 950, fontSize: 18, color:"#0f172a" }}>{am("app.title")}</div>
          <div style={{ marginLeft:"auto", display:"flex", gap: 8 }}>
            <Button icon={<PlusOutlined />} type="primary" style={{ borderRadius: 12, background:"#22c55e", border:"none" }} onClick={()=>nav("/auto-market/create")}>
              {am("app.createAd")}
            </Button>
          </div>
        </div>

        <div style={{ padding: "0 14px 12px", display:"flex", gap: 10, alignItems:"center" }}>
          <Input
            value={filters.q}
            onChange={(e)=>patchFilters({ q: e.target.value })}
            placeholder={am("feed.searchPlaceholder")}
            style={{ borderRadius: 14 }}
          />
          <Button icon={<FilterOutlined />} onClick={()=>setDrawer(true)} style={{ borderRadius: 14 }} />
          <SortDropdown />
        </div>
      </div>

      <StoriesRail />
      <QuickNavPanel />
      <SmartFilterBar />

      <div style={{ padding: "12px 14px" }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding: 30 }}><Spin /></div>
        ) : error ? (
          <div style={{ color:"#ef4444", fontWeight: 800 }}>{error}</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {renderItems()}
          </div>
        )}

        <div style={{ display:"flex", gap: 10, justifyContent:"center", marginTop: 18 }}>
          <Button disabled={page<=1} onClick={()=>go(page-1)} style={{ borderRadius: 12 }}>{am("app.previous")}</Button>
          <div style={{ alignSelf:"center", fontWeight: 800, color:"#64748b" }}>{page}/{pageCount}</div>
          <Button disabled={page>=pageCount} onClick={()=>go(page+1)} style={{ borderRadius: 12 }}>{am("app.next")}</Button>
        </div>
      </div>

      <CompareFloatBtn />
      <FullFilterDrawer open={drawer} onClose={()=>setDrawer(false)} />
    </div>
  );
}
