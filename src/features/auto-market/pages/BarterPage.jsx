/**
 * BarterPage.jsx
 * Barter — mashina almashtirish bo'limi.
 * Foydalanuvchi o'z mashinasini tanlaydi va mos e'lonlarni ko'radi.
 */
import React, { useEffect, useState, useMemo } from "react";
import { Button, Select, Spin, Empty, Tag, message, Input } from "antd";
import { ArrowLeftOutlined, SwapOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listBarterAdsByOfferModel, createBarterOffer } from "../services/marketApi";
import { BRANDS, MODELS_BY_BRAND } from "../services/staticData";
import PriceTag from "../components/Common/PriceTag";

export default function BarterPage() {
  const nav = useNavigate();
  const [offerBrand, setOfferBrand] = useState("");
  const [offerModel, setOfferModel] = useState("");
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [sent, setSent]             = useState(new Set());
  const [q, setQ]                   = useState("");

  const modelOptions = useMemo(
    () => (MODELS_BY_BRAND[offerBrand] || []).map(m => ({ value:m, label:m })),
    [offerBrand]
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await listBarterAdsByOfferModel(offerBrand, offerModel, { q });
      setItems(res);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [offerBrand, offerModel, q]);

  const sendOffer = async (ad) => {
    if (!offerBrand && !offerModel) {
      message.warning("Avval o'z mashinangizni tanlang");
      return;
    }
    await createBarterOffer({
      ad_id:       ad.id,
      offer_brand: offerBrand,
      offer_model: offerModel,
      extra_payment: 0,
    });
    setSent(prev => new Set([...prev, ad.id]));
    message.success("✅ Barter taklifi yuborildi!");
  };

  return (
    <div style={{ paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"#ffffffcc", backdropFilter:"blur(10px)", borderBottom:"1px solid #e2e8f0" }}>
        <div style={{ padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
          <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius:14 }} />
          <div>
            <div style={{ fontWeight:950, fontSize:16, color:"#0f172a" }}>🔄 Barter</div>
            <div style={{ fontSize:11, color:"#059669" }}>Mashina almashtirish</div>
          </div>
        </div>
      </div>

      {/* O'z mashinangizni tanlash */}
      <div style={{ margin:"12px 14px", padding:14, background:"#f0fdf4", borderRadius:16, border:"1.5px solid #86efac" }}>
        <div style={{ fontWeight:800, color:"#059669", marginBottom:10 }}>🚗 Sizning mashinangiz:</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          <Select
            value={offerBrand || undefined}
            onChange={v => { setOfferBrand(v||""); setOfferModel(""); }}
            allowClear placeholder="Marka"
            style={{ width:"100%" }}
            options={BRANDS.map(b => ({ value:b.name, label:b.name }))}
          />
          <Select
            value={offerModel || undefined}
            onChange={v => setOfferModel(v||"")}
            allowClear disabled={!offerBrand}
            placeholder="Model"
            style={{ width:"100%" }}
            options={modelOptions}
          />
        </div>
        {offerBrand && offerModel && (
          <Tag color="success" style={{ borderRadius:999 }}>
            {offerBrand} {offerModel} → almashtirish mumkin
          </Tag>
        )}
      </div>

      <div style={{ padding:"0 14px" }}>
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Qidirish: Gentra, Cobalt..."
          style={{ borderRadius:14, marginBottom:12 }}
        />
        <div style={{ fontWeight:800, color:"#64748b", fontSize:13, marginBottom:10 }}>
          Barter qabul qiladigan e'lonlar:
        </div>

        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spin size="large" /></div>
        ) : items.length === 0 ? (
          <Empty description="Barter qabul qiladigan e'lonlar topilmadi" style={{ marginTop:30 }} />
        ) : (
          <div style={{ display:"grid", gap:12 }}>
            {items.map(ad => (
              <div key={ad.id} style={{
                background:"#fff", border:"1px solid #e2e8f0", borderRadius:18,
                overflow:"hidden", boxShadow:"0 10px 30px rgba(2,6,23,.06)"
              }}>
                <div style={{ display:"flex", cursor:"pointer" }} onClick={()=>nav(`/auto-market/ad/${ad.id}`)}>
                  <img src={ad.images?.[0]} alt="" style={{ width:110, height:85, objectFit:"cover", flexShrink:0 }} />
                  <div style={{ padding:"10px 12px", flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:900, fontSize:13 }}>{ad.brand} {ad.model} {ad.year}</div>
                    <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>
                      {ad.city} • {Number(ad.mileage||0).toLocaleString("uz-UZ")} km
                    </div>
                    <PriceTag price={ad.price} currency={ad.currency} />
                    {ad.barter_brand && (
                      <div style={{ fontSize:11, color:"#059669", marginTop:4, fontWeight:700 }}>
                        Qabul: {ad.barter_brand} {ad.barter_model || "har qanday"}
                        {ad.barter_extra_ok && " + ustiga pul"}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ borderTop:"1px solid #f1f5f9", padding:"8px 12px", display:"flex", gap:8, justifyContent:"flex-end" }}>
                  <Button size="small" onClick={()=>nav(`/auto-market/ad/${ad.id}`)} style={{ borderRadius:10 }}>Batafsil</Button>
                  <Button
                    size="small" type="primary"
                    disabled={sent.has(ad.id)}
                    onClick={()=>sendOffer(ad)}
                    style={{ borderRadius:10, background: sent.has(ad.id) ? undefined : "#059669", border:"none" }}
                  >
                    {sent.has(ad.id) ? "✅ Yuborildi" : "🔄 Taklif qilish"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
