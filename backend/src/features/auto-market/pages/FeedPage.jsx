import React, { useState } from "react";
import { Button, Input, Spin } from "antd";
import { PlusOutlined, FilterOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import StoriesRail from "../components/Feed/StoriesRail";
import SmartFilterBar from "../components/Feed/SmartFilterBar";
import CarCardVertical from "../components/Feed/CarCardVertical";
import CompareFloatBtn from "../components/Feed/CompareFloatBtn";
import SortDropdown from "../components/Feed/SortDropdown";
import FullFilterDrawer from "../components/Filters/FullFilterDrawer";
import useCarList from "../hooks/useCarList";
import { useMarket } from "../context/MarketContext";

export default function FeedPage() {
  const nav = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const { filters, patchFilters } = useMarket();
  const { items, loading, error, page, pageCount, go } = useCarList(filters, { pageSize: 12 });

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ position:"sticky", top:0, zIndex: 50, background:"#ffffffcc", backdropFilter:"blur(10px)", borderBottom:"1px solid #e2e8f0" }}>
        <div style={{ padding: "12px 14px", display:"flex", gap: 10, alignItems:"center" }}>
          <div style={{ fontWeight: 950, fontSize: 18, color:"#0f172a" }}>Auto Market</div>
          <div style={{ marginLeft:"auto", display:"flex", gap: 8 }}>
            <Button icon={<PlusOutlined />} type="primary" style={{ borderRadius: 12, background:"#22c55e", border:"none" }} onClick={()=>nav("/auto-market/create")}>
              E'lon berish
            </Button>
          </div>
        </div>

        <div style={{ padding: "0 14px 12px", display:"flex", gap: 10, alignItems:"center" }}>
          <Input
            value={filters.q}
            onChange={(e)=>patchFilters({ q: e.target.value })}
            placeholder="Qidirish: Cobalt, Gentra..."
            style={{ borderRadius: 14 }}
          />
          <Button icon={<FilterOutlined />} onClick={()=>setDrawer(true)} style={{ borderRadius: 14 }} />
          <SortDropdown />
        </div>
      </div>

      <StoriesRail />
      <SmartFilterBar />

      <div style={{ padding: "12px 14px" }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding: 30 }}><Spin /></div>
        ) : error ? (
          <div style={{ color:"#ef4444", fontWeight: 800 }}>{error}</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {items.map((ad) => (
              <CarCardVertical
                key={ad.id}
                ad={ad}
                onClick={() => nav(`/auto-market/ad/${ad.id}`)}
              />
            ))}
          </div>
        )}

        <div style={{ display:"flex", gap: 10, justifyContent:"center", marginTop: 18 }}>
          <Button disabled={page<=1} onClick={()=>go(page-1)} style={{ borderRadius: 12 }}>Oldingi</Button>
          <div style={{ alignSelf:"center", fontWeight: 800, color:"#64748b" }}>{page}/{pageCount}</div>
          <Button disabled={page>=pageCount} onClick={()=>go(page+1)} style={{ borderRadius: 12 }}>Keyingi</Button>
        </div>
      </div>

      <CompareFloatBtn />
      <FullFilterDrawer open={drawer} onClose={()=>setDrawer(false)} />
    </div>
  );
}
