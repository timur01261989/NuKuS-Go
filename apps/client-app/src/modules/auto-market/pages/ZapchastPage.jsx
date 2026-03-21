import React, { useEffect, useState, useMemo } from "react";
import { Button, Select, Input, Spin, Empty, Tag, Modal, message, Row, Col, Card, Badge } from "antd";
import { ArrowLeftOutlined, PlusOutlined, PhoneOutlined, SearchOutlined, CarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listZapchast, createZapchastAd } from "../services/marketBackend";
import { BRANDS, MODELS_BY_BRAND, ZAPCHAST_CATEGORIES, ZAPCHAST_CONDITIONS } from "../services/staticData";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";
import { createAmHelpers } from "../utils/autoMarketLocalize";

function ZapchastCard({ item }) {
  const { locale, am } = useAutoMarketI18n();
  const { zapConditionLabel } = createAmHelpers(locale, am);
  const cat = ZAPCHAST_CATEGORIES.find((c) => c.id === item.category);
  const condition = ZAPCHAST_CONDITIONS.find((c) => c.value === item.condition);
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 14, boxShadow: "0 4px 16px rgba(2,6,23,.03)", display: "flex", gap: 12, marginBottom: 12, position: "relative" }}>
      {item.is_premium && <Badge.Ribbon text={am("autoExtra.premium")} color="gold" style={{ top: -10 }} />}
      <div style={{ width: 64, height: 64, borderRadius: 16, background: item.is_premium ? "#fefce8" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, border: item.is_premium ? "1px solid #fde047" : "1px solid transparent" }}>{cat?.emoji || "📦"}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h4 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#1e293b" }}>{item.title}</h4>
          <Tag color={condition?.color || "blue"} style={{ borderRadius: 6, margin: 0, fontSize: 10 }}>{zapConditionLabel(item.condition || condition?.value || item.condition)}</Tag>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><CarOutlined style={{ fontSize: 14 }} /><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.compatible_brand} {item.compatible_model} {am("autoExtra.forCar")}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 17, color: "#059669" }}>{item.price?.toLocaleString()} <span style={{ fontSize: 12 }}>{item.currency}</span></div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}><EnvironmentOutlined /> {item.city || "O'zbekiston"}</div>
        </div>
      </div>
      <Button type="primary" shape="circle" icon={<PhoneOutlined />} style={{ alignSelf: "center", background: "#0ea5e9", border: "none", boxShadow: "0 4px 10px rgba(14,165,233,0.3)" }} onClick={() => { if (item.phone) window.location.href = `tel:${item.phone}`; else message.info(am("autoExtra.phoneMissing")); }} />
    </div>
  );
}

export default function ZapchastPage() {
  const nav = useNavigate();
  const { am, locale } = useAutoMarketI18n();
  const { zapConditionLabel } = createAmHelpers(locale, am);
  const [list, setList] = useState([]); const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ brand: "", model: "", category: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isModal, setIsModal] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", category: "", compatible_brand: "", compatible_model: "", price: "", currency: "UZS", condition: "new", city: "", phone: "", desc: "" });
  const load = async () => { setLoading(true); try { setList(await listZapchast() || []); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filteredList = useMemo(() => list.filter((item) => { const mBrand=!filter.brand || item.compatible_brand===filter.brand; const mModel=!filter.model || item.compatible_model===filter.model; const mCat=!filter.category || item.category===filter.category; const mSearch=!searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()); return mBrand && mModel && mCat && mSearch; }), [list, filter, searchQuery]);
  const handleCreate = async () => { if (!newItem.title || !newItem.category || !newItem.price) return message.warning(am("autoExtra.fillRequired")); try { await createZapchastAd(newItem); message.success(am("autoExtra.adAdded")); setIsModal(false); load(); } catch { message.error(am("autoExtra.genericError")); } };

  return <div style={{ padding: "16px 16px 100px", background: "#f8fafc", minHeight: "100vh" }}>
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
      <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => nav(-1)} />
      <div style={{ flex: 1 }}><h1 style={{ margin: 0, fontWeight: 950, fontSize: 22 }}>{am("autoExtra.spareParts")}</h1><div style={{ fontSize: 12, color: "#64748b" }}>{am("autoExtra.sparePartsSub")}</div></div>
      <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 12, height: 40, background: "#10b981", border: "none" }} onClick={() => setIsModal(true)}>{am("autoExtra.sell")}</Button>
    </div>
    <Card style={{ borderRadius: 24, border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.04)", marginBottom: 16 }}>
      <Input prefix={<SearchOutlined style={{ color: "#94a3b8" }} />} placeholder={am("autoExtra.searchParts")} size="large" variant="filled" style={{ borderRadius: 14, marginBottom: 12 }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      <Row gutter={8}>
        <Col span={12}><Select placeholder={am("autoExtra.brand")} style={{ width: "100%" }} allowClear value={filter.brand || undefined} onChange={(v) => setFilter((p) => ({ ...p, brand: v || "", model: "" }))} options={BRANDS.map((b) => ({ value: b.name, label: b.name }))} /></Col>
        <Col span={12}><Select placeholder={am("autoExtra.model")} style={{ width: "100%" }} disabled={!filter.brand} value={filter.model || undefined} onChange={(v) => setFilter((p) => ({ ...p, model: v || "" }))} options={(MODELS_BY_BRAND[filter.brand] || []).map((m) => ({ value: m, label: m }))} /></Col>
      </Row>
      <div style={{ marginTop: 8 }}><Select placeholder={am("autoExtra.select")} style={{ width: "100%" }} allowClear value={filter.category || undefined} onChange={(v) => setFilter((p) => ({ ...p, category: v || "" }))} options={ZAPCHAST_CATEGORIES.map((c) => ({ value: c.id, label: `${c.emoji} ${c.label}` }))} /></div>
    </Card>
    {loading ? <div style={{ textAlign: "center", padding: 30 }}><Spin /></div> : filteredList.length ? filteredList.map((item) => <ZapchastCard key={item.id || item.title} item={item} />) : <Empty description={am("common.empty")} />}
    <Modal title={am("autoExtra.sell")} open={isModal} onOk={handleCreate} onCancel={() => setIsModal(false)} okText={am("autoExtra.sell")} cancelText={am("common.cancel")}>
      <Input placeholder={am("autoExtra.title")} value={newItem.title} onChange={(e)=>setNewItem((p)=>({...p,title:e.target.value}))} style={{ marginBottom: 10 }} />
      <Select placeholder={am("autoExtra.select")} value={newItem.category || undefined} onChange={(v)=>setNewItem((p)=>({...p,category:v}))} style={{ width:"100%", marginBottom: 10 }} options={ZAPCHAST_CATEGORIES.map((c)=>({ value:c.id, label:`${c.emoji} ${c.label}` }))} />
      <Row gutter={8}><Col span={12}><Select placeholder={am("autoExtra.brand")} value={newItem.compatible_brand || undefined} onChange={(v)=>setNewItem((p)=>({...p,compatible_brand:v,compatible_model:""}))} style={{ width:"100%", marginBottom: 10 }} options={BRANDS.map((b)=>({ value:b.name, label:b.name }))} /></Col><Col span={12}><Select placeholder={am("autoExtra.model")} value={newItem.compatible_model || undefined} onChange={(v)=>setNewItem((p)=>({...p,compatible_model:v}))} style={{ width:"100%", marginBottom: 10 }} options={(MODELS_BY_BRAND[newItem.compatible_brand] || []).map((m)=>({ value:m, label:m }))} /></Col></Row>
      <Row gutter={8}><Col span={12}><Input placeholder={am("common.price")} value={newItem.price} onChange={(e)=>setNewItem((p)=>({...p,price:e.target.value}))} /></Col><Col span={12}><Select value={newItem.condition} onChange={(v)=>setNewItem((p)=>({...p,condition:v}))} style={{ width:"100%" }} options={ZAPCHAST_CONDITIONS.map((c)=>({ value:c.value, label:zapConditionLabel(c.value) }))} /></Col></Row>
      <Input placeholder={am("autoExtra.city")} value={newItem.city} onChange={(e)=>setNewItem((p)=>({...p,city:e.target.value}))} style={{ marginTop: 10 }} />
      <Input placeholder={am("autoExtra.phone")} value={newItem.phone} onChange={(e)=>setNewItem((p)=>({...p,phone:e.target.value}))} style={{ marginTop: 10 }} />
      <Input.TextArea rows={3} placeholder={am("autoExtra.description")} value={newItem.desc} onChange={(e)=>setNewItem((p)=>({...p,desc:e.target.value}))} style={{ marginTop: 10 }} />
    </Modal>
  </div>;
}
