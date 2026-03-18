import React, { useEffect, useState } from "react";
import { Button, Spin, Tag } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listFavoriteCars } from "../services/marketBackend";
import CarCardHorizontal from "../components/Feed/CarCardHorizontal";
import { useMarket } from "../context/MarketContext";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";
import { buildSavedSearchHints, buildBuyerDecisionChecklist } from "../services/autoMarketDecisionSupport";
import { buildFavoritesConciergeHints } from "../services/autoMarketShowroom";
import { saveSearchDraft, saveAlertDraft, listSavedSearches, listSavedAlerts, buildSavedSearchInsights, buildSavedAlertInsights } from "../services/autoMarketBuyerCore";
import { buildFavoritesEmptyState, buildReservationReadinessStates } from "../services/autoMarketExtendedSignals";

export default function FavoritesPage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const { filters } = useMarket();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const savedSearchHints = buildSavedSearchHints(filters);
  const conciergeHints = buildFavoritesConciergeHints(items);
  const savedSearchInsights = buildSavedSearchInsights(listSavedSearches(), filters);
  const savedAlertInsights = buildSavedAlertInsights(listSavedAlerts(), filters);
  const emptyState = buildFavoritesEmptyState();
  const reservationSignals = buildReservationReadinessStates({ price: items?.[0]?.price || 0 });

  const load = async () => {
    setLoading(true);
    try {
      const res = await listFavoriteCars(filters);
      setItems(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.q, filters.brand, filters.model, filters.city]);

  return (
    <div style={{ padding: 14, paddingBottom: 80 }}>
      <div style={{ display:"flex", gap: 10, alignItems:"center", marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius: 14 }} />
        <div style={{ fontWeight: 950, fontSize: 18, color:"#0f172a" }}>{am("favorites.title")}</div>
      </div>

      {loading ? <div style={{ display:"flex", justifyContent:"center", padding: 30 }}><Spin /></div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 12 }}>
        {reservationSignals.map((item) => (
          <div key={item.key} style={{ borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", padding: 12 }}>
            {item.asset ? <img src={item.asset} alt={item.title} style={{ width: 30, height: 30, objectFit: "contain", marginBottom: 8 }} /> : null}
            <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.title}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{item.note}</div>
          </div>
        ))}
        {savedSearchInsights.concat(savedAlertInsights).map((item) => (
          <div key={item.key} style={{ borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", padding: 12 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
            <div style={{ marginTop: 6, fontWeight: 900, color: "#0f172a" }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <Button style={{ borderRadius: 999 }} onClick={() => saveSearchDraft(filters)}>Hozirgi filtrni saqlash</Button>
        <Button style={{ borderRadius: 999 }} onClick={() => { saveAlertDraft(filters); load(); }}>Narx va yangi e'lon alerti</Button>
        <Button style={{ borderRadius: 999 }} onClick={() => nav("/auto-market/saved-searches")}>Saqlangan qidiruvlar</Button>
        <Button style={{ borderRadius: 999 }} onClick={() => nav("/auto-market/saved-alerts")}>Saqlangan alertlar</Button>
      </div>

      {!loading ? (
        <div style={{ borderRadius: 20, border: "1px solid #e2e8f0", background: "#fff", padding: 14, marginBottom: 12, boxShadow: "0 10px 30px rgba(2,6,23,.04)" }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Sevimlilarni adashmay boshqaring</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {savedSearchHints.map((hint) => <Tag key={hint} style={{ borderRadius: 999, paddingInline: 10 }}>{hint}</Tag>)}
          </div>
        </div>
      ) : null}

      <div style={{ borderRadius: 20, padding: 14, marginBottom: 12, background: "linear-gradient(135deg,#fff7ed 0%,#ffffff 100%)", border: "1px solid #fed7aa" }}>
        <div style={{ fontWeight: 900, color: "#9a3412" }}>Premium kuzatuv rejimi</div>
        <div style={{ marginTop: 6, color: "#7c2d12", fontSize: 13 }}>
          Sevimlilar ichida narx, ishonch va keyingi qadamni bir joyda ko'ring.
        </div>
      </div>

      <div style={{ borderRadius: 20, padding: 14, marginBottom: 12, background: "linear-gradient(135deg,#111827 0%,#1d4ed8 100%)", border: "1px solid rgba(15,23,42,.08)", color: "#fff" }}>
        <div style={{ fontWeight: 900 }}>{conciergeHints.title}</div>
        <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,.82)" }}>
          {conciergeHints.text}
        </div>
      </div>

      <div style={{ display:"grid", gap: 10 }}>
        {items.map(ad => {
          const checklist = buildBuyerDecisionChecklist(ad);
          return (
            <div key={ad.id} style={{ display: "grid", gap: 8 }}>
              <CarCardHorizontal ad={ad} onClick={()=>nav(`/auto-market/ad/${ad.id}`)} />
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {checklist.map((item) => (
                  <div key={item.key} style={{ borderRadius: 16, padding: 12, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
                    <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13 }}>{item.title}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && !items.length ? (
        <div style={{ marginTop: 20, borderRadius: 22, border: "1px solid #e2e8f0", background: "#fff", padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14, alignItems: "center" }}>
            <img src={emptyState.image} alt={emptyState.title} style={{ width: 120, height: 84, objectFit: "contain" }} />
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>{emptyState.title}</div>
              <div style={{ marginTop: 6, color:"#64748b", fontWeight: 600 }}>{emptyState.note}</div>
              <Button style={{ borderRadius: 999, marginTop: 12 }} onClick={() => nav("/auto-market/feed")}>Mashina tanlashni davom ettirish</Button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, padding: 12, borderRadius: 16, background: "#f8fafc" }}>
            <img src={emptyState.ctaImage} alt="Rezerv" style={{ width: 34, height: 34, objectFit: "contain" }} />
            <div style={{ fontSize: 12, color: "#475569" }}>Saralangan mashinani topganingizda bron va alertni bir bosishda yoqish mumkin.</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
