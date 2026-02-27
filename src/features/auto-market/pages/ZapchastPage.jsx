/**
 * ZapchastPage.jsx
 * Ehtiyot qismlar bo'limi.
 * Smart filter: marka/model tanlansa, faqat o'sha mashinaga mos qismlar chiqadi.
 */
import React, { useEffect, useState, useMemo } from "react";
import { Button, Select, Input, Spin, Empty, Tag, Modal, message } from "antd";
import { ArrowLeftOutlined, PlusOutlined, PhoneOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listZapchast, createZapchastAd } from "../services/marketApi";
import { BRANDS, MODELS_BY_BRAND, ZAPCHAST_CATEGORIES, ZAPCHAST_CONDITIONS } from "../services/staticData";

function ZapchastCard({ item }) {
  const cat = ZAPCHAST_CATEGORIES.find(c => c.id === item.category);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:16,
      padding:12, boxShadow:"0 4px 16px rgba(2,6,23,.05)",
      display:"flex", gap:10
    }}>
      <div style={{
        width:48, height:48, borderRadius:14, background:"#f1f5f9",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:22, flexShrink:0
      }}>
        {cat?.emoji || "📦"}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:900, fontSize:13, color:"#0f172a" }}>{item.title}</div>
        <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>
          {item.compatible_brand} {item.compatible_model} {item.compatible_years}
        </div>
        <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap", alignItems:"center" }}>
          <Tag color={item.condition==="new"?"success":item.condition==="used"?"default":"error"}
            style={{ borderRadius:999, margin:0, fontSize:10 }}>
            {ZAPCHAST_CONDITIONS.find(c=>c.value===item.condition)?.label || item.condition}
          </Tag>
          <span style={{ fontWeight:900, color:"#0ea5e9", fontSize:13 }}>
            {Number(item.price||0).toLocaleString("uz-UZ")} {item.currency}
          </span>
          <span style={{ fontSize:11, color:"#94a3b8" }}>{item.city}</span>
        </div>
      </div>
      <Button
        size="small" type="primary" icon={<PhoneOutlined />}
        href={`tel:${item.phone}`}
        style={{ borderRadius:10, background:"#22c55e", border:"none", flexShrink:0 }}
      />
    </div>
  );
}

export default function ZapchastPage() {
  const nav = useNavigate();
  const [brand, setBrand]       = useState("");
  const [model, setModel]       = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ]               = useState("");
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [addOpen, setAddOpen]   = useState(false);
  const [newItem, setNewItem]   = useState({ title:"", category:"other", compatible_brand:"", compatible_model:"", price:"", currency:"UZS", condition:"used", city:"Nukus", phone:"", is_razborka:false });

  const modelOptions = useMemo(
    () => (MODELS_BY_BRAND[brand]||[]).map(m=>({value:m,label:m})),
    [brand]
  );

  const load = async () => {
    setLoading(true);
    try { setItems(await listZapchast({ brand, model, category, q, is_razborka: false })); }
    catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [brand, model, category, q]);

  const handleAdd = async () => {
    if (!newItem.title) { message.warning("Sarlavha kiriting"); return; }
    await createZapchastAd(newItem);
    setAddOpen(false);
    setNewItem({ title:"", category:"other", compatible_brand:"", compatible_model:"", price:"", currency:"UZS", condition:"used", city:"Nukus", phone:"", is_razborka:false });
    load();
    message.success("E'lon qo'shildi!");
  };

  return (
    <div style={{ paddingBottom:90 }}>
      <div style={{ position:"sticky", top:0, zIndex:50, background:"#ffffffcc", backdropFilter:"blur(10px)", borderBottom:"1px solid #e2e8f0" }}>
        <div style={{ padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
          <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius:14 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:950, fontSize:16, color:"#0f172a" }}>🔩 Zapchast</div>
            <div style={{ fontSize:11, color:"#64748b" }}>Ehtiyot qismlar bozori</div>
          </div>
          <Button icon={<PlusOutlined />} type="primary" onClick={()=>setAddOpen(true)}
            style={{ borderRadius:12, background:"#22c55e", border:"none" }}>E'lon</Button>
        </div>
        {/* Smart filter */}
        <div style={{ padding:"0 14px 10px", display:"flex", gap:8, flexWrap:"wrap" }}>
          <Select value={brand||undefined} onChange={v=>{setBrand(v||"");setModel("");}} allowClear placeholder="Marka"
            style={{width:110}} options={BRANDS.map(b=>({value:b.name,label:b.name}))} />
          <Select value={model||undefined} onChange={v=>setModel(v||"")} allowClear disabled={!brand} placeholder="Model"
            style={{width:110}} options={modelOptions} />
          <Select value={category||undefined} onChange={v=>setCategory(v||"")} allowClear placeholder="Kategoriya"
            style={{width:130}} options={ZAPCHAST_CATEGORIES.map(c=>({value:c.id,label:`${c.emoji} ${c.label}`}))} />
        </div>
        <div style={{ padding:"0 14px 12px" }}>
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Qidirish..." style={{ borderRadius:14 }} />
        </div>
      </div>

      <div style={{ padding:"12px 14px" }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spin size="large" /></div>
        ) : items.length === 0 ? (
          <Empty description="Zapchast topilmadi" style={{ marginTop:30 }}>
            <Button onClick={()=>setAddOpen(true)} style={{ borderRadius:12 }}>E'lon qo'shish</Button>
          </Empty>
        ) : (
          <div style={{ display:"grid", gap:10 }}>
            {brand && model && (
              <div style={{ background:"#f0fdf4", borderRadius:12, padding:"8px 12px", fontSize:12, color:"#059669", fontWeight:700 }}>
                ✅ {brand} {model} uchun {items.length} ta zapchast topildi
              </div>
            )}
            {items.map(item => <ZapchastCard key={item.id} item={item} />)}
          </div>
        )}
      </div>

      {/* E'lon qo'shish modal */}
      <Modal title="Zapchast e'lon qo'shish" open={addOpen} onOk={handleAdd} onCancel={()=>setAddOpen(false)}
        okText="Qo'shish" cancelText="Bekor">
        <div style={{ display:"grid", gap:10, marginTop:10 }}>
          <Input placeholder="Sarlavha *" value={newItem.title} onChange={e=>setNewItem(p=>({...p,title:e.target.value}))} />
          <Select value={newItem.category} onChange={v=>setNewItem(p=>({...p,category:v}))}
            options={ZAPCHAST_CATEGORIES.map(c=>({value:c.id,label:`${c.emoji} ${c.label}`}))} style={{width:"100%"}} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Select value={newItem.compatible_brand||undefined} allowClear placeholder="Marka"
              onChange={v=>setNewItem(p=>({...p,compatible_brand:v||"",compatible_model:""}))}
              options={BRANDS.map(b=>({value:b.name,label:b.name}))} style={{width:"100%"}} />
            <Input placeholder="Model" value={newItem.compatible_model}
              onChange={e=>setNewItem(p=>({...p,compatible_model:e.target.value}))} />
            <Input placeholder="Narx" value={newItem.price}
              onChange={e=>setNewItem(p=>({...p,price:e.target.value}))} />
            <Select value={newItem.currency} onChange={v=>setNewItem(p=>({...p,currency:v}))}
              options={[{value:"UZS",label:"UZS"},{value:"USD",label:"USD"}]} style={{width:"100%"}} />
            <Select value={newItem.condition} onChange={v=>setNewItem(p=>({...p,condition:v}))}
              options={ZAPCHAST_CONDITIONS.map(c=>({value:c.value,label:c.label}))} style={{width:"100%"}} />
            <Input placeholder="Shahar" value={newItem.city}
              onChange={e=>setNewItem(p=>({...p,city:e.target.value}))} />
          </div>
          <Input placeholder="Telefon *" value={newItem.phone}
            onChange={e=>setNewItem(p=>({...p,phone:e.target.value}))} />
        </div>
      </Modal>
    </div>
  );
}
