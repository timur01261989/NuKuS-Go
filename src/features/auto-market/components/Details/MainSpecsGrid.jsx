import React from "react";
import { Card } from "antd";
import { CalendarOutlined, DashboardOutlined, ThunderboltOutlined, SettingOutlined } from "@ant-design/icons";
import { useAutoMarketI18n } from "../../utils/useAutoMarketI18n";

function Spec({ icon, label, value }) {
  return <div style={{ display:"flex", gap:10, alignItems:"center", background:"#f8fafc", borderRadius:14, padding:"12px 14px" }}><div style={{ width:34, height:34, borderRadius:12, background:"#e0f2fe", display:"flex", alignItems:"center", justifyContent:"center", color:"#0284c7" }}>{icon}</div><div><div style={{ fontSize:12, color:"#64748b", fontWeight:700 }}>{label}</div><div style={{ fontWeight:900, color:"#0f172a" }}>{value || "-"}</div></div></div>;
}

export default function MainSpecsGrid({ car }) {
  const { am } = useAutoMarketI18n();
  return <Card style={{ borderRadius:18, border:"1px solid #e2e8f0" }} bodyStyle={{ padding:14 }} title={<div style={{ fontWeight:900, color:"#0f172a" }}>{am("autoExtra.mainSpecs")}</div>}>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
      <Spec icon={<CalendarOutlined />} label={am("common.year")} value={car?.year} />
      <Spec icon={<DashboardOutlined />} label={am("common.mileage")} value={(car?.mileage ?? "-") + " km"} />
      <Spec icon={<ThunderboltOutlined />} label={am("autoExtra.engine")} value={car?.engine} />
      <Spec icon={<SettingOutlined />} label={am("autoExtra.transmission")} value={car?.transmission} />
    </div>
  </Card>;
}
