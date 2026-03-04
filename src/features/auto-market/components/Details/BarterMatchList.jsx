/**
 * BarterMatchList.jsx
 * E'lon sahifasida "Barter takliflari" bo'limi.
 * Foydalanuvchi o'z mashinasini tanlaydi va mos barterga tayyor e'lonlarni ko'radi.
 *
 * Props: car (joriy e'lon), onClose
 */
import React, { useEffect, useState } from "react";
import { Button, Select, Spin, Empty, Tag, Drawer } from "antd";
import { SwapOutlined } from "@ant-design/icons";
import { listBarterAdsByOfferModel, createBarterOffer } from "../../services/marketBackend";
import { BRANDS, MODELS_BY_BRAND } from "../../services/staticData";
import PriceTag from "../Common/PriceTag";

export default function BarterMatchList({ car, visible, onClose }) {
  const [offerBrand, setOfferBrand] = useState("");
  const [offerModel, setOfferModel] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(new Set());

  const modelOptions = (MODELS_BY_BRAND[offerBrand] || []).map(m => ({ value: m, label: m }));

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    listBarterAdsByOfferModel(offerBrand, offerModel)
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [visible, offerBrand, offerModel]);

  const sendOffer = async (targetAdId) => {
    await createBarterOffer({
      ad_id: targetAdId,
      offer_brand: offerBrand || "Noma'lum",
      offer_model: offerModel || "Noma'lum",
      extra_payment: 0,
    });
    setSent(prev => new Set([...prev, targetAdId]));
  };

  return (
    <Drawer
      title={<span><SwapOutlined style={{ marginRight: 8, color:"#059669" }} />Barter — Mashina almashtirish</span>}
      placement="bottom"
      height="80vh"
      open={visible}
      onClose={onClose}
      bodyStyle={{ padding: "16px 14px 40px" }}
    >
      <div style={{ background:"#f0fdf4", borderRadius: 14, padding: 12, marginBottom: 16 }}>
        <div style={{ fontWeight:800, color:"#059669", marginBottom: 10 }}>Sizning mashinangiz:</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize:12, color:"#64748b", fontWeight:700, marginBottom:4 }}>Marka</div>
            <Select
              value={offerBrand || undefined}
              onChange={v => { setOfferBrand(v); setOfferModel(""); }}
              allowClear
              placeholder="Marka tanlang"
              style={{ width:"100%" }}
              options={BRANDS.map(b => ({ value:b.name, label:b.name }))}
            />
          </div>
          <div>
            <div style={{ fontSize:12, color:"#64748b", fontWeight:700, marginBottom:4 }}>Model</div>
            <Select
              value={offerModel || undefined}
              onChange={setOfferModel}
              allowClear
              disabled={!offerBrand}
              placeholder="Model"
              style={{ width:"100%" }}
              options={modelOptions}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:30 }}><Spin /></div>
      ) : matches.length === 0 ? (
        <Empty description="Barter qabul qiladigan e'lonlar topilmadi" style={{ marginTop:30 }} />
      ) : (
        <div style={{ display:"grid", gap:10 }}>
          {matches.map(ad => (
            <div key={ad.id} style={{
              background:"#fff", border:"1px solid #e2e8f0", borderRadius:16,
              padding:12, display:"flex", gap:10, alignItems:"center"
            }}>
              <img
                src={ad.images?.[0]}
                alt=""
                style={{ width:80, height:60, objectFit:"cover", borderRadius:10, flexShrink:0 }}
              />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:900, fontSize:13 }}>{ad.brand} {ad.model} {ad.year}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{ad.city} • {Number(ad.mileage||0).toLocaleString("uz-UZ")} km</div>
                <PriceTag price={ad.price} currency={ad.currency} />
              </div>
              <Button
                type={sent.has(ad.id) ? "default" : "primary"}
                size="small"
                disabled={sent.has(ad.id)}
                onClick={() => sendOffer(ad.id)}
                style={{ borderRadius:10, flexShrink:0, background: sent.has(ad.id) ? undefined : "#059669", border:"none" }}
              >
                {sent.has(ad.id) ? "✅ Yuborildi" : "Taklif"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
