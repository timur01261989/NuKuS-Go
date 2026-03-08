import React, { useMemo } from "react";
import { Drawer, Button, Input, Select, Switch, Slider } from "antd";
import { useMarket } from "../../context/MarketContext";
import { CITIES, BRANDS, MODELS_BY_BRAND } from "../../services/staticData";
import { useAutoMarketI18n } from "../../utils/useAutoMarketI18n";

export default function FullFilterDrawer({ open, onClose }) {
  const { filters, patchFilters, resetFilters } = useMarket();
  const { am } = useAutoMarketI18n();
  const modelOptions = useMemo(() => (MODELS_BY_BRAND[filters.brand] || []).map((m) => ({ value: m, label: m })), [filters.brand]);
  return (
    <Drawer title={am("autoExtra.filterExpanded")} placement="bottom" open={open} onClose={onClose} height="78vh" bodyStyle={{ paddingBottom: 90 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.query")}</div><Input value={filters.q} onChange={(e)=>patchFilters({ q: e.target.value })} placeholder="Gentra, Cobalt..." /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.city")}</div><Select value={filters.city || undefined} onChange={(v)=>patchFilters({ city: v })} allowClear style={{ width:"100%" }} options={CITIES.map((x)=>({value:x,label:x}))} /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.brand")}</div><Select value={filters.brand || undefined} onChange={(v)=>patchFilters({ brand: v, model: "" })} allowClear style={{ width:"100%" }} options={BRANDS.map((b)=>({value:b.name,label:b.name}))} /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.model")}</div><Select value={filters.model || undefined} onChange={(v)=>patchFilters({ model: v })} allowClear disabled={!filters.brand} style={{ width:"100%" }} options={modelOptions} /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.yearFrom")}</div><Input value={filters.yearFrom} onChange={(e)=>patchFilters({ yearFrom: e.target.value })} placeholder="2015" /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.yearTo")}</div><Input value={filters.yearTo} onChange={(e)=>patchFilters({ yearTo: e.target.value })} placeholder="2024" /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.minPrice")}</div><Input value={filters.minPrice} onChange={(e)=>patchFilters({ minPrice: e.target.value })} placeholder="30000000" /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.maxPrice")}</div><Input value={filters.maxPrice} onChange={(e)=>patchFilters({ maxPrice: e.target.value })} placeholder="120000000" /></div>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6 }}>
          <div style={{ display:"flex", gap: 10, alignItems:"center" }}><Switch checked={filters.kredit} onChange={(v)=>patchFilters({ kredit: v })} /><span style={{ fontWeight: 800 }}>{am("autoExtra.kredit")}</span></div>
          <div style={{ display:"flex", gap: 10, alignItems:"center" }}><Switch checked={filters.exchange} onChange={(v)=>patchFilters({ exchange: v })} /><span style={{ fontWeight: 800 }}>{am("autoExtra.exchange")}</span></div>
          <div style={{ display:"flex", gap: 10, alignItems:"center" }}><Switch checked={filters.nearMe} onChange={(v)=>patchFilters({ nearMe: v })} /><span style={{ fontWeight: 800 }}>{am("autoExtra.nearby")}</span></div>
          <div style={{ display:"flex", gap: 10, alignItems:"center" }}><Switch checked={filters.vikup} onChange={(v)=>patchFilters({ vikup: v })} /><span style={{ fontWeight: 800, color: "#d97706" }}>💳 {am("app.vikup")}</span></div>
          <div style={{ display:"flex", gap: 10, alignItems:"center" }}><Switch checked={filters.barter} onChange={(v)=>patchFilters({ barter: v })} /><span style={{ fontWeight: 800, color: "#059669" }}>🔄 {am("app.barter")}</span></div>
        </div>
        {filters.nearMe ? <div style={{ gridColumn:"1 / -1", marginTop: 8 }}><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.radius")}: {filters.radiusKm}</div><Slider min={1} max={100} value={Number(filters.radiusKm || 10)} onChange={(v)=>patchFilters({ radiusKm: v })} /></div> : null}
      </div>
      <div style={{ position:"fixed", left:0, right:0, bottom:0, padding: 12, background:"#fff", borderTop:"1px solid #e2e8f0", display:"flex", gap: 10 }}>
        <Button onClick={resetFilters} style={{ borderRadius: 14, flex: 1 }}>{am("common.reset")}</Button>
        <Button type="primary" onClick={onClose} style={{ borderRadius: 14, flex: 1, background:"#2563eb", border:"none" }}>{am("common.apply")}</Button>
      </div>
    </Drawer>
  );
}
