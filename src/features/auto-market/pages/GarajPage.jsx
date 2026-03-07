/**
 * GarajPage.jsx
 * "Mening Garajim" — orzu qilgan mashinalar.
 * Narx tushganda xabar beradi (localStorage polling).
 */
import React, { useEffect, useState } from "react";
import { Button, Empty, Tag, message, Badge } from "antd";
import { ArrowLeftOutlined, DeleteOutlined, RightOutlined, BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGaraj } from "../context/GarajContext";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";

export default function GarajPage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const { items, remove } = useGaraj();
  const [priceDrop, setPriceDrop] = useState([]);

  // Narx tushishini simulatsiya (real loyihada Supabase realtime ishlatiladi)
  useEffect(() => {
    if (!items.length) return;
    const drops = items
      .filter(g => g.price_at_add && g.current_price && g.current_price < g.price_at_add)
      .map(g => g.ad_id);
    setPriceDrop(drops);
  }, [items]);

  const handleRemove = async (adId) => {
    await remove(adId);
    message.info("Garajdan o'chirildi");
  };

  const fmt = (n, cur) => {
    if (!n) return "—";
    if (cur === "USD") return `$${Number(n).toLocaleString("uz-UZ")}`;
    return `${Number(n).toLocaleString("uz-UZ")} so'm`;
  };

  return (
    <div style={{ padding: 14, paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius:14 }} />
        <div>
          <div style={{ fontWeight:950, fontSize:18, color:"#0f172a" }}>🚗 Mening Garajim</div>
          <div style={{ fontSize:11, color:"#64748b" }}>Orzu qilgan mashinalarim</div>
        </div>
        <Badge count={priceDrop.length} style={{ marginLeft:"auto" }}>
          <BellOutlined style={{ fontSize:20, color: priceDrop.length ? "#d97706" : "#94a3b8" }} />
        </Badge>
      </div>

      {/* Narx tushish xabari */}
      {priceDrop.length > 0 && (
        <div style={{ background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:14, padding:12, marginBottom:14 }}>
          <div style={{ fontWeight:800, color:"#d97706" }}>
            🔔 {priceDrop.length} ta mashinangiz narxi tushdi!
          </div>
          <div style={{ fontSize:12, color:"#92400e", marginTop:4 }}>
            Garajingizni ko'rib chiqing va yaxshi vaqtida oling.
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <Empty
          description="Garajingiz bo'sh"
          style={{ marginTop:60 }}
        >
          <Button type="primary" onClick={()=>nav("/auto-market")} style={{ borderRadius:12, background:"#22c55e", border:"none" }}>
            Mashinalar ko'rish
          </Button>
        </Empty>
      ) : (
        <div style={{ display:"grid", gap:12 }}>
          {items.map(g => {
            const dropped = priceDrop.includes(g.ad_id);
            const dropAmt = g.price_at_add && g.current_price
              ? g.price_at_add - g.current_price
              : 0;
            return (
              <div key={g.id} style={{
                background:"#fff",
                border: `1.5px solid ${dropped ? "#fde68a" : "#e2e8f0"}`,
                borderRadius:18, overflow:"hidden",
                boxShadow:"0 10px 30px rgba(2,6,23,.06)",
                position:"relative",
              }}>
                {dropped && (
                  <div style={{
                    position:"absolute", top:10, left:10, zIndex:2,
                    background:"#d97706", color:"#fff", borderRadius:999,
                    fontSize:11, fontWeight:800, padding:"3px 10px",
                    boxShadow:"0 4px 12px rgba(217,119,6,.4)"
                  }}>
                    ↓ Narx tushdi!
                  </div>
                )}
                <div style={{ display:"flex", cursor:"pointer" }} onClick={()=>nav(`/auto-market/ad/${g.ad_id}`)}>
                  {g.image_url && (
                    <img src={g.image_url} alt="" style={{ width:110, height:90, objectFit:"cover", flexShrink:0 }} />
                  )}
                  <div style={{ padding:"12px 12px", flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:900, fontSize:14, color:"#0f172a" }}>
                      {g.brand} {g.model} {g.year}
                    </div>
                    <div style={{ marginTop:4, fontSize:12 }}>
                      <span style={{ color:"#64748b" }}>Qo'shilganda: </span>
                      <span style={{ fontWeight:700 }}>{fmt(g.price_at_add, g.currency)}</span>
                    </div>
                    {dropped && dropAmt > 0 && (
                      <div style={{ fontSize:12, color:"#16a34a", fontWeight:800, marginTop:2 }}>
                        ↓ {fmt(dropAmt, g.currency)} arzonladi!
                      </div>
                    )}
                    <div style={{ marginTop:4, fontSize:11, color:"#94a3b8" }}>
                      {new Date(g.added_at).toLocaleDateString("uz-UZ")}
                    </div>
                  </div>
                </div>
                <div style={{ borderTop:"1px solid #f1f5f9", padding:"8px 12px", display:"flex", gap:8, justifyContent:"flex-end" }}>
                  <Button
                    size="small" danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(g.ad_id)}
                    style={{ borderRadius:10 }}
                  >
                    O'chirish
                  </Button>
                  <Button
                    size="small" type="primary"
                    icon={<RightOutlined />}
                    onClick={()=>nav(`/auto-market/ad/${g.ad_id}`)}
                    style={{ borderRadius:10, background:"#0ea5e9", border:"none" }}
                  >
                    Ko'rish
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
