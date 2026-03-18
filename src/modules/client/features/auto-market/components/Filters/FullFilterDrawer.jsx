
import React, { useMemo } from "react";
import { Drawer, Button, Input, Select, Switch, Slider } from "antd";
import { useMarket } from "../../context/MarketContext";
import { CITIES, BRANDS, MODELS_BY_BRAND, BODY_TYPES, FUELS, TRANSMISSIONS, COLORS, DRIVE_TYPES } from "../../services/staticData";
import { useAutoMarketI18n } from "../../utils/useAutoMarketI18n";
import EVBatteryFilters from "./EVBatteryFilters";
import { buildAdvancedFilterSections } from "../../services/autoMarketBuyerCore";
import { buildBodyColorOptions, buildExtendedBodyTypeOptions, buildFilterAssistVisual } from "../../services/autoMarketExtendedSignals";

const buyerFilterKeys = ["priceDropOnly", "inspectionMin", "sellerType"];

export default function FullFilterDrawer({ open, onClose }) {
  const { filters, patchFilters, resetFilters } = useMarket();
  const { am } = useAutoMarketI18n();
  const modelOptions = useMemo(() => (MODELS_BY_BRAND[filters.brand] || []).map((m) => ({ value: m, label: m })), [filters.brand]);
  const sections = useMemo(() => buildAdvancedFilterSections(), []);
  const colorVisuals = useMemo(() => buildBodyColorOptions(), []);
  const filterAssist = useMemo(() => buildFilterAssistVisual(), []);
  const extendedBodyVisuals = useMemo(() => buildExtendedBodyTypeOptions().slice(0, 10), []);

  return (
    <Drawer title={am("autoExtra.filterExpanded")} placement="bottom" open={open} onClose={onClose} height="84vh" bodyStyle={{ paddingBottom: 90 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.query")}</div><Input value={filters.q} onChange={(e)=>patchFilters({ q: e.target.value })} placeholder="Gentra, Cobalt..." /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.city")}</div><Select value={filters.city || undefined} onChange={(v)=>patchFilters({ city: v })} allowClear style={{ width:"100%" }} options={CITIES.map((x)=>({value:x,label:x}))} /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.brand")}</div><Select value={filters.brand || undefined} onChange={(v)=>patchFilters({ brand: v, model: "" })} allowClear style={{ width:"100%" }} options={BRANDS.map((b)=>({value:b.name,label:b.name}))} /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.model")}</div><Select value={filters.model || undefined} onChange={(v)=>patchFilters({ model: v })} allowClear disabled={!filters.brand} style={{ width:"100%" }} options={modelOptions} /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Kuzov turi</div><Select value={filters.bodyType || undefined} onChange={(v)=>patchFilters({ bodyType: v })} allowClear style={{ width:"100%" }} options={BODY_TYPES.map((x)=>({value:x,label:x}))} /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Yoqilg'i</div><Select value={filters.fuel_type || undefined} onChange={(v)=>patchFilters({ fuel_type: v })} allowClear style={{ width:"100%" }} options={FUELS.map((x)=>({value:x,label:x}))} /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Uzatma</div><Select value={filters.transmission || undefined} onChange={(v)=>patchFilters({ transmission: v })} allowClear style={{ width:"100%" }} options={TRANSMISSIONS.map((x)=>({value:x,label:x}))} /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Rang</div><Select value={filters.color || undefined} onChange={(v)=>patchFilters({ color: v })} allowClear style={{ width:"100%" }} options={COLORS.map((x)=>({value:x,label:x}))} /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Yuritma</div><Select value={filters.driveType || undefined} onChange={(v)=>patchFilters({ driveType: v })} allowClear style={{ width:"100%" }} options={DRIVE_TYPES.map((x)=>({value:x,label:x}))} /></div>
        <div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Sotuvchi</div><Select value={filters.sellerType || undefined} onChange={(v)=>patchFilters({ sellerType: v })} allowClear style={{ width:"100%" }} options={[{value:"dealer",label:"Diler"},{value:"private",label:"Ega"}]} /></div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Narx oralig'i</div>
        <Slider range min={0} max={1000000000} step={10000000} value={[Number(filters.minPrice || 0), Number(filters.maxPrice || 500000000)]} onChange={(v)=>patchFilters({ minPrice: v[0], maxPrice: v[1] })} />
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Yil oralig'i</div>
        <Slider range min={2005} max={2025} value={[Number(filters.yearFrom || 2010), Number(filters.yearTo || 2025)]} onChange={(v)=>patchFilters({ yearFrom: v[0], yearTo: v[1] })} />
      </div>

      <div style={{ marginTop: 16, padding: 14, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>Chuqur buyer filterlar</div>
        {sections.map((section) => (
          <div key={section.key} style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 800, color: "#334155", marginBottom: 8 }}>{section.title}</div>
            <div style={{ display: "grid", gap: 10 }}>
              {section.controls.map((control) => {
                if (control.type === "switch") {
                  return (
                    <div key={control.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#0f172a", fontWeight: 700 }}>{control.label}</span>
                      <Switch checked={!!filters[control.key]} onChange={(checked) => patchFilters({ [control.key]: checked })} />
                    </div>
                  );
                }
                if (control.type === "select") {
                  return (
                    <div key={control.key}>
                      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{control.label}</div>
                      <Select value={filters[control.key] || undefined} onChange={(v)=>patchFilters({ [control.key]: v })} allowClear style={{ width:"100%" }} options={control.options} />
                    </div>
                  );
                }
                return (
                  <div key={control.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{control.label}</span>
                      <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 800 }}>{filters[control.key] || 0}</span>
                    </div>
                    <Slider min={control.min} max={control.max} value={Number(filters[control.key] || 0)} onChange={(value)=>patchFilters({ [control.key]: value })} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>


      <div style={{ marginTop: 12, padding: 14, borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <img src={filterAssist.asset} alt={filterAssist.title} style={{ width: 28, height: 28, objectFit: "contain" }} />
          <div>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>{filterAssist.title}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{filterAssist.note}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {colorVisuals.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => patchFilters({ color: filters.color === item.label ? "" : item.label })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                padding: "8px 12px",
                border: `1px solid ${filters.color === item.label ? "#2563eb" : "#e2e8f0"}`,
                background: filters.color === item.label ? "rgba(37,99,235,.08)" : "#fff",
                cursor: "pointer",
              }}
            >
              {item.asset ? <img src={item.asset} alt={item.label} style={{ width: 18, height: 18, objectFit: "contain", borderRadius: 999 }} /> : <span style={{ width: 10, height: 10, borderRadius: 999, background: "#cbd5e1", display: "inline-block" }} />}
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>


      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop: 14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:12, border:"1px solid #e2e8f0", borderRadius:16 }}>
          <span style={{ fontWeight: 700 }}>Kredit</span>
          <Switch checked={!!filters.kredit} onChange={(v)=>patchFilters({ kredit: v })} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:12, border:"1px solid #e2e8f0", borderRadius:16 }}>
          <span style={{ fontWeight: 700 }}>Barter</span>
          <Switch checked={!!filters.exchange} onChange={(v)=>patchFilters({ exchange: v })} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:12, border:"1px solid #e2e8f0", borderRadius:16 }}>
          <span style={{ fontWeight: 700 }}>Batareya kafolati</span>
          <Switch checked={!!filters.batteryWarranty} onChange={(v)=>patchFilters({ batteryWarranty: v })} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:12, border:"1px solid #e2e8f0", borderRadius:16 }}>
          <span style={{ fontWeight: 700 }}>Narxi tushganlar</span>
          <Switch checked={!!filters.priceDropOnly} onChange={(v)=>patchFilters({ priceDropOnly: v })} />
        </div>
      </div>

      <EVBatteryFilters style={{ marginTop: 14 }} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12, marginTop: 16 }}>
        <Button onClick={resetFilters}>Tozalash</Button>
        <Button type="primary" onClick={onClose}>Natijalarni ko'rsatish</Button>
      </div>
    </Drawer>
  );
}
