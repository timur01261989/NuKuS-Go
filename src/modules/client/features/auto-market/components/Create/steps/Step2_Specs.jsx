import React from "react";
import { Card, Input, Select, Switch, Tag, Divider, Tooltip } from "antd";
import { useCreateAd } from "../../../context/CreateAdContext";
import { FUELS, TRANSMISSIONS, COLORS } from "../../../services/staticData";
import { BgColorsOutlined, AppstoreAddOutlined, DollarOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useAutoMarketI18n } from "../../../utils/useAutoMarketI18n";
import { createAmHelpers } from "../../../utils/autoMarketLocalize";

export default function Step2_Specs() {
  const { ad, patch } = useCreateAd();
  const { locale, am } = useAutoMarketI18n();
  const { fuelLabel, transmissionLabel, colorLabel } = createAmHelpers(locale, am);
  const bodyParts = ad.body_parts || {};
  const togglePart = (part) => {
    const current = bodyParts[part] || "clean";
    const nextMap = { clean: "painted", painted: "replaced", replaced: "clean" };
    patch({ body_parts: { ...bodyParts, [part]: nextMap[current] } });
  };
  const getPartColor = (part) => {
    const status = bodyParts[part];
    if (status === "painted") return "#f59e0b";
    if (status === "replaced") return "#ef4444";
    return "#e2e8f0";
  };
  const features = ["Lyuk", "Konditsioner", "ABS", "Video registrator", "Muzlatgich", "Charm salon", "Ksenon", "Parktronik"];
  const toggleFeature = (f) => {
    const current = ad.features || [];
    patch({ features: current.includes(f) ? current.filter((i) => i !== f) : [...current, f] });
  };
  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 16 }}>{am("autoExtra.specs")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("common.year")}</div>
          <Input value={ad.year} onChange={(e)=>patch({ year: e.target.value })} placeholder="2020" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("common.mileage")} (km)</div>
          <Input value={ad.mileage} onChange={(e)=>patch({ mileage: e.target.value })} placeholder="45000" />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.fuelType")}</div>
        <Select value={ad.fuel_type || undefined} onChange={(v)=>patch({ fuel_type: v })} style={{ width: "100%" }} options={FUELS.map((f)=>({value:f,label:fuelLabel(f)}))} placeholder={am("autoExtra.select")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.transmission")}</div>
          <Select value={ad.transmission || undefined} onChange={(v)=>patch({ transmission: v })} style={{ width: "100%" }} options={TRANSMISSIONS.map((t)=>({value:t,label:transmissionLabel(t)}))} placeholder={am("autoExtra.select")} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.color")}</div>
          <Select value={ad.color || undefined} onChange={(v)=>patch({ color: v })} style={{ width: "100%" }} options={COLORS.map((c)=>({value:c,label:colorLabel(c)}))} placeholder={am("autoExtra.select")} />
        </div>
      </div>
      <Divider style={{ margin: "20px 0" }} />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <BgColorsOutlined /> {am("autoExtra.bodyCondition")}
          <Tooltip title={am("autoExtra.bodyConditionHint")}><InfoCircleOutlined style={{ fontSize: 12, color: "#94a3b8" }} /></Tooltip>
        </div>
        <div style={{ background: "#f8fafc", padding: 15, borderRadius: 12, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 10 }}>
            <div onClick={() => togglePart("kapot")} style={{ width: 60, height: 40, background: getPartColor("kapot"), border: "1px solid #cbd5e1", borderRadius: "4px 4px 0 0", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>{am("autoExtra.hood")}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
            <div onClick={() => togglePart("left_door")} style={{ width: 40, height: 60, background: getPartColor("left_door"), border: "1px solid #cbd5e1", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>{am("autoExtra.left")}</div>
            <div style={{ width: 50, height: 60, background: "#e2e8f0", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>{am("autoExtra.roof")}</div>
            <div onClick={() => togglePart("right_door")} style={{ width: 40, height: 60, background: getPartColor("right_door"), border: "1px solid #cbd5e1", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>{am("autoExtra.right")}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 10 }}>
            <div onClick={() => togglePart("bagaj")} style={{ width: 60, height: 35, background: getPartColor("bagaj"), border: "1px solid #cbd5e1", borderRadius: "0 0 4px 4px", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>{am("autoExtra.trunk")}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 15 }}>
            <Tag color="default">{am("autoExtra.clean")}</Tag>
            <Tag color="warning">{am("autoExtra.painted")}</Tag>
            <Tag color="error">{am("autoExtra.replaced")}</Tag>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><AppstoreAddOutlined /> {am("autoExtra.options")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {features.map((f) => (
            <Tag.CheckableTag key={f} checked={(ad.features || []).includes(f)} onChange={() => toggleFeature(f)} style={{ border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: 8, fontSize: 13 }}>{f}</Tag.CheckableTag>
          ))}
        </div>
      </div>
      <Divider style={{ margin: "20px 0" }} />
      <div style={{ background: "#f1f5f9", padding: 12, borderRadius: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}><DollarOutlined style={{ color: "#10b981" }} /> {am("autoExtra.vikupGive")}</div>
          <Switch checked={!!ad.is_vikup} onChange={(v) => patch({ is_vikup: v })} />
        </div>
      </div>
    </Card>
  );
}
