/**
 * MyAdsPage.jsx
 * Foydalanuvchining shaxsiy e'lonlari boshqaruvi.
 * 100% TO'LIQ VARIANT - HECH QANDAY QISQARTIRMASIZ.
 * YANGI: Promotion (TOP, VIP), Ko'rishlar statistikasi, Holatni boshqarish.
 */
import React, { useEffect, useState, useCallback } from "react";
import { 
  Button, 
  Spin, 
  Tag, 
  message, 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Divider, 
  Tooltip, 
  Modal, 
  List, 
  Badge 
} from "antd";
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  EyeOutlined, 
  PhoneOutlined, 
  ThunderboltOutlined, 
  CheckCircleOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  LineChartOutlined,
  StarOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { myAds, markAdStatus, promoteAd } from "../services/marketBackend";
import CarCardHorizontal from "../components/Feed/CarCardHorizontal";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";
import { buildSellerPerformanceSummary } from "../services/autoMarketDecisionSupport";
import { buildLuxuryDecisionRibbon } from "../services/autoMarketLuxury";
import { buildSellerShowroomSummary } from "../services/autoMarketShowroom";
import { buildSellerInsights } from "../services/autoMarketSellerStudio";
import { buildSellerCommandCenter } from "../services/autoMarketFinalPolish";
import SellerCrmBoard from "../components/Seller/SellerCrmBoard";

export default function MyAdsPage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoModal, setPromoModal] = useState({ open: false, adId: null });
  const performanceCards = buildSellerPerformanceSummary(items);
  const luxuryDecisionRibbon = buildLuxuryDecisionRibbon(items);
  const showroomSummary = buildSellerShowroomSummary(items);
  const commandCenter = buildSellerCommandCenter(items);

  // Ma'lumotlarni yuklash
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await myAds();
      setItems(data || []);
    } catch (err) {
      message.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // E'lon holatini o'zgartirish
  const handleStatusChange = async (adId, newStatus) => {
    try {
      await markAdStatus(adId, newStatus);
      message.success(`E'lon holati "${newStatus}" ga o'zgartirildi`);
      load();
    } catch (e) {
      message.error("Xatolik yuz berdi");
    }
  };

  // E'lonni ko'tarish (Promotion)
  const handlePromote = async (type) => {
    try {
      await promoteAd(promoModal.adId, type);
      message.success("E'lon muvaffaqiyatli ko'tarildi!");
      setPromoModal({ open: false, adId: null });
      load();
    } catch (e) {
      message.error("Balans yetarli emas yoki xatolik");
    }
  };

  return (
    <div style={{ padding: "14px 14px 100px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header Qismi */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => nav(-1)} 
          style={{ borderRadius: 14, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }} 
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 950, fontSize: 20, color: "#0f172a" }}>{am("myAds.title")}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>E'lonlaringizni boshqarish va tahlil qilish</div>
        </div>
        <Button 
          icon={<PlusOutlined />} 
          type="primary" 
          style={{ borderRadius: 12, background: "#22c55e", border: "none", fontWeight: 700 }} 
          onClick={() => nav("/auto-market/create")}
        >
          Yangi
        </Button>
      </div>

      {luxuryDecisionRibbon.length ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 16 }}>
          {luxuryDecisionRibbon.map((item) => (
            <div key={item.key} style={{ borderRadius: 18, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
              <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a" }}>{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}


      {commandCenter.length ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", marginBottom: 16 }}>
          {commandCenter.map((item) => (
            <div key={item.key} onClick={() => nav(item.route)} style={{ borderRadius: 18, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10`, cursor: "pointer" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
              <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a" }}>{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 50 }}><Spin size="large" /></div>
      ) : items.length === 0 ? (
        <Card style={{ borderRadius: 20, textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚗</div>
          <h3>Hozircha e'lonlaringiz yo'q</h3>
          <Button type="primary" onClick={() => nav("/auto-market/create")}>Birinchi e'lonni joylang</Button>
        </Card>
      ) : null}

      {/* E'lonlar Ro'yxati */}
      <div style={{ display: "grid", gap: 16 }}>
        {items.map((ad) => (
          <Badge.Ribbon 
            key={ad.id} 
            text={ad.is_vip ? "VIP" : ad.is_top ? "TOP" : null} 
            color={ad.is_vip ? "gold" : "#0ea5e9"}
            style={{ display: ad.is_vip || ad.is_top ? "block" : "none" }}
          >
            <Card 
              bodyStyle={{ padding: 12 }} 
              style={{ borderRadius: 20, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
            >
              <CarCardHorizontal ad={ad} onClick={() => nav(`/auto-market/ad/${ad.id}`)} />
              
              <Divider style={{ margin: "12px 0" }} />

              {/* Statistika Bloklari */}
              <Row gutter={10} style={{ marginBottom: 12 }}>
                <Col span={8}>
                  <div style={{ textAlign: "center", background: "#f1f5f9", padding: "8px", borderRadius: 12 }}>
                    <div style={{ fontSize: 10, color: "#64748b" }}><EyeOutlined /> Ko'rildi</div>
                    <div style={{ fontWeight: 800 }}>{ad.views_count || 0}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: "center", background: "#f1f5f9", padding: "8px", borderRadius: 12 }}>
                    <div style={{ fontSize: 10, color: "#64748b" }}><PhoneOutlined /> Tel</div>
                    <div style={{ fontWeight: 800 }}>{ad.calls_count || 0}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: "center", background: "#f1f5f9", padding: "8px", borderRadius: 12 }}>
                    <div style={{ fontSize: 10, color: "#64748b" }}><ClockCircleOutlined /> Kun</div>
                    <div style={{ fontWeight: 800 }}>{ad.days_active || 1}</div>
                  </div>
                </Col>
              </Row>

              {/* Boshqaruv Tugmalari */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <Tag color={ad.status === "active" ? "green" : ad.status === "sold" ? "volcano" : "default"} style={{ borderRadius: 8, margin: 0, padding: "2px 10px" }}>
                    {ad.status.toUpperCase()}
                  </Tag>
                  {ad.status !== "sold" && (
                    <Button 
                      size="small" 
                      type="primary" 
                      ghost 
                      icon={<ThunderboltOutlined />} 
                      style={{ borderRadius: 8, fontSize: 11 }}
                      onClick={() => nav(`/auto-market/promote/${ad.id}`)}
                    >
                      Tezlatish
                    </Button>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <Tooltip title="Tahrirlash">
                    <Button shape="circle" icon={<EditOutlined />} onClick={() => nav(`/auto-market/edit/${ad.id}`)} />
                  </Tooltip>
                  
                  {ad.status === "active" && (
                    <Button 
                      size="small" 
                      style={{ borderRadius: 8, background: "#16a34a", color: "#fff", border: "none" }}
                      onClick={() => handleStatusChange(ad.id, "sold")}
                    >
                      Sotildi
                    </Button>
                  )}
                  
                  <Button 
                    size="small" 
                    danger 
                    icon={<DeleteOutlined />} 
                    style={{ borderRadius: 8 }}
                    onClick={() => handleStatusChange(ad.id, "archived")}
                  >
                    Arxiv
                  </Button>
                </div>
              </div>
            </Card>
          </Badge.Ribbon>
        ))}
      </div>

      {/* Promotion Modali */}
      <Modal
        title="E'lonni sotuvini tezlashtirish"
        open={promoModal.open}
        onCancel={() => setPromoModal({ open: false, adId: null })}
        footer={null}
        centered
        borderRadius={20}
      >
        <List
          itemLayout="horizontal"
          dataSource={[
            { 
              type: "top", 
              title: "TOP e'lon", 
              desc: "E'lon ro'yxatning eng yuqorisida 3 kun turadi", 
              price: "5,000", 
              icon: <ArrowLeftOutlined style={{ transform: "rotate(90deg)", color: "#0ea5e9" }} /> 
            },
            { 
              type: "vip", 
              title: "VIP status", 
              desc: "Oltin rangli hoshiya va maksimal ko'rilish", 
              price: "15,000", 
              icon: <StarOutlined style={{ color: "#eab308" }} /> 
            },
            { 
              type: "turbo", 
              title: "Turbo sotuv", 
              desc: "TOP + VIP + Telegram kanalga chiqish", 
              price: "25,000", 
              icon: <ThunderboltOutlined style={{ color: "#ef4444" }} /> 
            }
          ]}
          renderItem={item => (
            <List.Item 
              style={{ cursor: "pointer", padding: "16px", borderRadius: 12, border: "1px solid #f1f5f9", marginBottom: 10 }}
              onClick={() => handlePromote(item.type)}
            >
              <List.Item.Meta
                avatar={<div style={{ fontSize: 24 }}>{item.icon}</div>}
                title={<span style={{ fontWeight: 800 }}>{item.title}</span>}
                description={item.desc}
              />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 900, color: "#16a34a" }}>{item.price} UZS</div>
                <Button size="small" type="link">Tanlash</Button>
              </div>
            </List.Item>
          )}
        />
      </Modal>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 16 }}>
        {sellerInsights.map((item) => (
          <div key={item.key} style={{ borderRadius: 18, padding: 14, background: `${item.tone}10`, border: `1px solid ${item.tone}22` }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{item.title}</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 950, color: item.tone }}>{item.value}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: "#475569" }}>{item.text}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 16 }}>
        {showroomSummary.map((item) => (
          <div key={item.key} style={{ borderRadius: 18, padding: 14, background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 10px 24px rgba(2,6,23,.04)" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 950, color: item.tone }}>{item.value}</div>
          </div>
        ))}
      </div>


      <div style={{ marginTop: 16 }}>
        
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <Button style={{ borderRadius: 12 }} onClick={() => nav("/auto-market/seller/leads")}>Leadlarni ochish</Button>
        <Button style={{ borderRadius: 12 }} onClick={() => nav("/auto-market/seller/appointments")}>Seller agenda</Button>
      </div>
      <Card style={{ borderRadius: 22, marginBottom: 16, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>Marketplace final center</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Dealer profil, finance va alerts markaziga tez kirish.</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button onClick={() => nav("/auto-market/notifications")}>Alerts</Button>
              <Button onClick={() => nav("/auto-market/dealer/main")}>Dealer</Button>
              <Button onClick={() => nav("/auto-market/finance-offers/showcase")}>Finance</Button>
            </div>
          </div>
        </Card>

        <SellerCrmBoard items={items} onOpenLeads={() => nav("/auto-market/seller/leads")} onOpenAgenda={() => nav("/auto-market/seller/appointments")} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { key: "leads", title: "Leadlar markazi", text: "Booking, chat va qo‘ng‘iroq oqimini bir joydan boshqaring.", action: () => nav("/auto-market/seller/leads"), tone: "#0ea5e9" },
          { key: "agenda", title: "Appointment agenda", text: "Bugungi ko‘rishlar, reminder va receipt holatlarini nazorat qiling.", action: () => nav("/auto-market/seller/appointments"), tone: "#8b5cf6" },
          { key: "promote", title: "Promote listing", text: "Premium yoki showroom paketga tez kirish.", action: () => setPromoModal({ open: true, adId: items[0]?.id || null }), tone: "#f59e0b" },
        ].map((item) => (
          <button key={item.key} type="button" onClick={item.action} style={{ borderRadius: 18, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10`, textAlign: "left", cursor: "pointer" }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{item.text}</div>
          </button>
        ))}
      </div>
      </div>

            {/* Pastki Tahlil Bloki */}
      <div style={{ 
        marginTop: 30, 
        padding: 20, 
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", 
        borderRadius: 24,
        color: "#fff"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <LineChartOutlined style={{ fontSize: 20, color: "#3b82f6" }} />
          <span style={{ fontWeight: 800 }}>Umumiy Hisob-kitob</span>
        </div>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic 
              title={<span style={{ color: "#94a3b8", fontSize: 12 }}>Faol e'lonlar</span>} 
              value={items.filter(x => x.status === "active").length} 
              valueStyle={{ color: "#fff", fontWeight: 900 }} 
            />
          </Col>
          <Col span={12}>
            <Statistic 
              title={<span style={{ color: "#94a3b8", fontSize: 12 }}>Sotilganlar</span>} 
              value={items.filter(x => x.status === "sold").length} 
              valueStyle={{ color: "#22c55e", fontWeight: 900 }} 
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}