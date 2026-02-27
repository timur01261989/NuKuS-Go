/**
 * RazborkaPage.jsx
 * Razborka — bo'laklangan mashinalar bozori.
 * Foydalanuvchi marka/model tanlaydi, o'sha mashinadan bo'laklangan
 * ehtiyot qismlarni topadi.
 */
import React, { useEffect, useState, useMemo } from "react";
import { Button, Select, Input, Spin, Empty, Tag, Modal, message } from "antd";
import { ArrowLeftOutlined, PlusOutlined, PhoneOutlined, ToolOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listZapchast, createZapchastAd } from "../services/marketApi";
import { BRANDS, MODELS_BY_BRAND, ZAPCHAST_CATEGORIES } from "../services/staticData";

export default function RazborkaPage() {
  const nav = useNavigate();
  const [brand, setBrand]     = useState("");
  const [model, setModel]     = useState("");
  const [q, setQ]             = useState("");
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title:"", category:"other", compatible_brand:"", compatible_model:"",
    compatible_years:"", price:"", currency:"UZS", condition:"damaged",
    city:"Nukus", phone:"", is_razborka:true
  });

  const modelOptions = useMemo(
    () => (MODELS_BY_BRAND[brand]||[]).map(m=>({value:m,label:m})),
    [brand]
  );

  const load = async () => {
    setLoading(true);
    try { setItems(await listZapchast({ brand, model, q, is_razborka: true })); }
    catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [brand, model, q]);

  const handleAdd = async () => {
    if (!newItem.title) { message.warning("Sarlavha kiriting"); return; }
    await createZapchastAd({ ...newItem, is_razborka:true });
    setAddOpen(false);
    load();
    message.success("Razborka e'loni qo'shildi!");
  };

  return (
    <div style={{ paddingBottom:90 }}>
      <div style={{ position:"sticky", top:0, zIndex:50, background:"#ffffffcc", backdropFilter:"blur(10px)", borderBottom:"1px solid #e2e8f0" }}>
        <div style={{ padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
          <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius:14 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:950, fontSize:16, color:"#0f172a" }}>🔧 Razborka</div>
            <div style={{ fontSize:11, color:"#64748b" }}>Bo'laklangan mashinalar</div>
          </div>
          <Button icon={<PlusOutlined />} type="primary" onClick={()=>setAddOpen(true)}
            style={{ borderRadius:12, background:"#dc2626", border:"none" }}>E'lon</Button>
        </div>
        <div style={{ padding:"0 14px 12px", display:"flex", gap:8, flexWrap:"wrap" }}>
          <Select value={brand||undefined} onChange={v=>{setBrand(v||"");setModel("");}} allowClear placeholder="Marka"
            style={{width:120}} options={BRANDS.map(b=>({value:b.name,label:b.name}))} />
          <Select value={model||undefined} onChange={v=>setModel(v||"")} allowClear disabled={!brand} placeholder="Model"
            style={{width:120}} options={modelOptions} />
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Qidiruv..." style={{ flex:1, borderRadius:14, minWidth:100 }} />
        </div>
      </div>

      {/* Tushuntirish */}
      <div style={{ margin:"12px 14px", padding:12, background:"#fff7ed", borderRadius:14, border:"1.5px solid #fed7aa" }}>
        <div style={{ fontWeight:800, color:"#ea580c", marginBottom:4 }}>🔧 Razborka nima?</div>
        <div style={{ fontSize:12, color:"#7c2d12", lineHeight:1.5 }}>
          Eski yoki shikastlangan mashinalarni bo'laklarga ajratib sotadiganlar.
          Arzon narxda original zapchast topasiz.
        </div>
      </div>

      <div style={{ padding:"0 14px" }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spin size="large" /></div>
        ) : items.length === 0 ? (
          <Empty description="Razborka e'lonlari topilmadi" style={{ marginTop:30 }}>
            <Button onClick={()=>setAddOpen(true)} style={{ borderRadius:12 }}>E'lon qo'shish</Button>
          </Empty>
        ) : (
          <div style={{ display:"grid", gap:10 }}>
            {brand && model && (
              <div style={{ background:"#fff7ed", borderRadius:12, padding:"8px 12px", fontSize:12, color:"#ea580c", fontWeight:700 }}>
                🔧 {brand} {model} razborkalari: {items.length} ta
              </div>
            )}
            {items.map(item => (
              <div key={item.id} style={{
                background:"#fff", border:"1.5px solid #fed7aa", borderRadius:16,
                padding:12, boxShadow:"0 4px 16px rgba(234,88,12,.06)"
              }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{
                    width:44, height:44, borderRadius:14, background:"#fff7ed",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0
                  }}>
                    {ZAPCHAST_CATEGORIES.find(c=>c.id===item.category)?.emoji || "🔧"}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:900, fontSize:13, color:"#0f172a" }}>{item.title}</div>
                    <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>
                      {item.compatible_brand} {item.compatible_model} {item.compatible_years}
                    </div>
                    <div style={{ display:"flex", gap:6, marginTop:6, alignItems:"center", flexWrap:"wrap" }}>
                      <Tag color="error" style={{ borderRadius:999, margin:0, fontSize:10 }}>Razborka</Tag>
                      <span style={{ fontWeight:900, color:"#ea580c", fontSize:13 }}>
                        {Number(item.price||0).toLocaleString("uz-UZ")} {item.currency}
                      </span>
                      <span style={{ fontSize:11, color:"#94a3b8" }}>{item.city}</span>
                    </div>
                  </div>
                  <Button
                    size="small" type="primary" icon={<PhoneOutlined />}
                    href={`tel:${item.phone}`}
                    style={{ borderRadius:10, background:"#ea580c", border:"none", flexShrink:0 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal title="Razborka e'lon qo'shish" open={addOpen} onOk={handleAdd} onCancel={()=>setAddOpen(false)}
        okText="Qo'shish" cancelText="Bekor">
        <div style={{ display:"grid", gap:10, marginTop:10 }}>
          <Input placeholder="Sarlavha (masalan: Cobalt 2017 to'liq razborka)" value={newItem.title}
            onChange={e=>setNewItem(p=>({...p,title:e.target.value}))} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Select value={newItem.compatible_brand||undefined} allowClear placeholder="Marka"
              onChange={v=>setNewItem(p=>({...p,compatible_brand:v||""}))}
              options={BRANDS.map(b=>({value:b.name,label:b.name}))} style={{width:"100%"}} />
            <Input placeholder="Model" value={newItem.compatible_model}
              onChange={e=>setNewItem(p=>({...p,compatible_model:e.target.value}))} />
            <Input placeholder="Yillar (2015-2020)" value={newItem.compatible_years}
              onChange={e=>setNewItem(p=>({...p,compatible_years:e.target.value}))} />
            <Input placeholder="Narx" value={newItem.price}
              onChange={e=>setNewItem(p=>({...p,price:e.target.value}))} />
          </div>
          <Input placeholder="Telefon *" value={newItem.phone}
            onChange={e=>setNewItem(p=>({...p,phone:e.target.value}))} />
          <Input placeholder="Shahar" value={newItem.city}
            onChange={e=>setNewItem(p=>({...p,city:e.target.value}))} />
        </div>
      </Modal>
    </div>
  );
}
