/**
 * VikupPage.jsx
 * Vikupga (Rent-to-Own) beriladigan mashinalar ro'yxati.
 * Har bir karta yonida minimal oylik to'lov ko'rsatiladi.
 */
import React, { useEffect, useState } from "react";
import { Button, Spin, Empty, Input, Select } from "antd";
import { ArrowLeftOutlined, CalculatorOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listVikupAds } from "../services/marketBackend";
import { BRANDS } from "../services/staticData";
import PriceTag from "../components/Common/PriceTag";
import VikupCalculator from "../components/Details/VikupCalculator";
import StatusBadge from "../components/Common/StatusBadge";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";

export default function VikupPage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [calcCar, setCalcCar] = useState(null);
  const [q, setQ]             = useState("");
  const [brand, setBrand]     = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await listVikupAds({ q, brand });
      setItems(res);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [q, brand]);

  return (
    <div style={{ paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"#ffffffcc", backdropFilter:"blur(10px)", borderBottom:"1px solid #e2e8f0" }}>
        <div style={{ padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
          <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius:14 }} />
          <div>
            <div style={{ fontWeight:950, fontSize:16, color:"#0f172a" }}>{am("vikup.title")}</div>
            <div style={{ fontSize:11, color:"#d97706" }}>{am("vikup.subtitle")}</div>
          </div>
        </div>
        <div style={{ padding:"0 14px 12px", display:"flex", gap:10 }}>
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={am("common.search")}
            style={{ borderRadius:14 }}
          />
          <Select
            value={brand || undefined}
            onChange={v => setBrand(v || "")}
            allowClear
            placeholder={am("common.brand")}
            style={{ width:130 }}
            options={BRANDS.map(b => ({ value:b.name, label:b.name }))}
          />
        </div>
      </div>

      {/* Kalkulyator tushuntirish */}
      <div style={{ margin:"12px 14px", padding:12, background:"#fffbeb", borderRadius:16, border:"1.5px solid #fde68a" }}>
        <div style={{ fontWeight:800, color:"#d97706", marginBottom:4 }}>{am("vikup.title")}</div>
        <div style={{ fontSize:12, color:"#92400e", lineHeight:1.5 }}>
          Boshlang'ich to'lovni (masalan $2,000) to'lang va qolganini oyiga $300 dan to'lang.
          Barcha hujjatlar rasmiylashtirilib beriladi.
        </div>
      </div>

      <div style={{ padding:"0 14px" }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spin size="large" /></div>
        ) : items.length === 0 ? (
          <Empty description={am("vikup.empty")} style={{ marginTop:40 }} />
        ) : (
          <div style={{ display:"grid", gap:12 }}>
            {items.map(ad => (
              <div key={ad.id} style={{ background:"#fff", border:"1px solid #fde68a", borderRadius:18, overflow:"hidden", boxShadow:"0 10px 30px rgba(217,119,6,.06)" }}>
                <div style={{ display:"flex", gap:0 }} onClick={()=>nav(`/auto-market/ad/${ad.id}`)}>
                  <img
                    src={ad.images?.[0]}
                    alt=""
                    style={{ width:120, height:90, objectFit:"cover", flexShrink:0, cursor:"pointer" }}
                  />
                  <div style={{ padding:"10px 12px", flex:1, minWidth:0, cursor:"pointer" }}>
                    <div style={{ fontWeight:900, fontSize:14, color:"#0f172a" }}>
                      {ad.brand} {ad.model} {ad.year}
                    </div>
                    <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>
                      {ad.city} • {Number(ad.mileage||0).toLocaleString("uz-UZ")} km
                    </div>
                    <PriceTag price={ad.price} currency={ad.currency} />
                    {ad.vikup && (
                      <div style={{ marginTop:6, fontSize:12, color:"#d97706", fontWeight:800 }}>
                        Boshlang'ich: ${Number(ad.vikup.initial_payment||2000).toLocaleString()} •{" "}
                        Oylik: ${Number(ad.vikup.monthly_payment||300).toLocaleString()}/{Number(ad.vikup.duration_months||12)} oy
                      </div>
                    )}
                  </div>
                </div>
                {/* Mini kalkulyator tugmasi */}
                <div style={{ borderTop:"1px solid #fde68a", padding:"8px 12px", display:"flex", justifyContent:"flex-end" }}>
                  <Button
                    size="small"
                    icon={<CalculatorOutlined />}
                    onClick={(e) => { e.stopPropagation(); setCalcCar(ad); }}
                    style={{ borderRadius:10, background:"#fffbeb", border:"1px solid #fde68a", color:"#d97706", fontWeight:700 }}
                  >
                    Hisoblash
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kalkulyator drawer */}
      {calcCar && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
          zIndex:1000, display:"flex", alignItems:"flex-end"
        }} onClick={() => setCalcCar(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ width:"100%", padding:16, background:"#fff", borderRadius:"20px 20px 0 0", maxHeight:"80vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontWeight:900 }}>{calcCar.brand} {calcCar.model} {calcCar.year}</div>
              <Button size="small" onClick={()=>setCalcCar(null)} style={{ borderRadius:10 }}>✕</Button>
            </div>
            <VikupCalculator car={calcCar} vikup={calcCar.vikup} />
          </div>
        </div>
      )}
    </div>
  );
}
