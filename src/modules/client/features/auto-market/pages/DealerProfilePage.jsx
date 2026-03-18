import React from "react";
import { Button, Card, Tag, Rate } from "antd";
import { ArrowLeftOutlined, PhoneOutlined, MessageOutlined, EnvironmentOutlined, StarOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { buildDealerTrustProfile, buildDealerReviews } from "../services/autoMarketMarketplaceFinal";
import { buildMarketplaceHubCards } from "../services/autoMarketFinalPolish";
import { buildDealerTierProfile, buildDealerTierLadder, buildInspectionCertificateCard, buildDealerTierBenefits, buildReservationReadinessStates, buildDealerActionTiles } from "../services/autoMarketExtendedSignals";

export default function DealerProfilePage() {
  const nav = useNavigate();
  const { sellerId } = useParams();
  const dealer = buildDealerTrustProfile({ id: sellerId, name: "UNIGO Showroom Partner", soldCount: 42, yearsOnPlatform: 5, responseSpeed: "12 daqiqa" });
  const reviewPack = buildDealerReviews({ id: sellerId, reviewCount: 138 });
  const hubCards = buildMarketplaceHubCards().slice(1);
  const dealerTier = buildDealerTierProfile({ responseRate: 93, reviewCount: 138, inventoryCount: 18, soldCount: 126 });
  const tierLadder = buildDealerTierLadder({ responseRate: 93, reviewCount: 138, inventoryCount: 18, soldCount: 126 });
  const inspectionCard = buildInspectionCertificateCard({ service_book: true });
  const tierBenefits = buildDealerTierBenefits({ responseRate: 93, reviewCount: 138, inventoryCount: 18, soldCount: 126 });
  const reservationStates = buildReservationReadinessStates({ price: 248000000 });
  const dealerActions = buildDealerActionTiles({ responseRate: 93, reviewCount: 138, inventoryCount: 18, soldCount: 126 });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 120 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} />
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Dealer profile</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Showroom, review va ishonch ko‘rsatkichlari</div>
        </div>
      </div>

      <div style={{ padding: 16, display: "grid", gap: 16 }}>
        <Card style={{ borderRadius: 24, border: "1px solid #e2e8f0", background: `linear-gradient(135deg, ${dealerTier.tone}14 0%, #fff 70%)` }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Dealer tier</div>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>{dealerTier.title}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: "#475569" }}>{dealerTier.note}</div>
            </div>
            <Tag style={{ borderRadius: 999, margin: 0, color: dealerTier.tone, borderColor: `${dealerTier.tone}33`, background: `${dealerTier.tone}12` }}>{dealerTier.title}</Tag>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{dealer.sellerName}</div>
              <div style={{ marginTop: 8, color: "#475569" }}>Dealer trust score: {dealer.trust}%</div>
              <div style={{ marginTop: 6, color: "#475569", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Rate disabled allowHalf value={reviewPack.average} style={{ fontSize: 16 }} />
                <span>{reviewPack.average} / 5 · {reviewPack.count} review</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {dealer.badges.map((badge) => <Tag key={badge} color="blue" style={{ margin: 0, borderRadius: 999 }}>{badge}</Tag>)}
            </div>
          </div>

          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            <div style={{ borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0", padding: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Ko‘rish va test drive</div>
              <div style={{ fontWeight: 900, color: "#0f172a", marginTop: 8 }}>{dealer.bookingSummary.total} ta oqim</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Tasdiqlangan: {dealer.bookingSummary.confirmed}</div>
            </div>
            <div style={{ borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0", padding: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Sotuvchi tajribasi</div>
              <div style={{ fontWeight: 900, color: "#0f172a", marginTop: 8 }}>{dealer.years} yil</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{dealer.sold} ta savdo</div>
            </div>
            <div style={{ borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0", padding: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Javob tezligi</div>
              <div style={{ fontWeight: 900, color: "#0f172a", marginTop: 8 }}>{dealer.response}</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Chat va qo‘ng‘iroq bo‘yicha faol</div>
            </div>
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button type="primary" icon={<PhoneOutlined />} style={{ borderRadius: 14 }}>Qo‘ng‘iroq qilish</Button>
            <Button icon={<MessageOutlined />} style={{ borderRadius: 14 }}>Chat ochish</Button>
            <Button icon={<EnvironmentOutlined />} style={{ borderRadius: 14 }}>Showroom manzili</Button>
          </div>
        </Card>

<Card style={{ borderRadius: 22, border: "1px solid #e2e8f0" }}>
  <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>Dealer darajasining foydalari</div>
  <div style={{ display: "grid", gap: 8 }}>
    {tierBenefits.map((item) => (
      <div key={item} style={{ borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 12px", fontSize: 13, color: "#334155" }}>
        {item}
      </div>
    ))}
  </div>
</Card>

<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
  {reservationStates.map((item) => (
    <Card key={item.key} style={{ borderRadius: 22, border: "1px solid #e2e8f0" }}>
      {item.asset ? <img src={item.asset} alt={item.title} style={{ width: 42, height: 42, objectFit: "contain", marginBottom: 10 }} /> : null}
      <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
      <div style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>{item.note}</div>
      <Tag style={{ marginTop: 10, borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", border: "none" }}>{item.cta}</Tag>
    </Card>
  ))}
</div>

        <Card title="Dealer review va rating" style={{ borderRadius: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            {reviewPack.highlights.map((item) => (
              <div key={item.key} style={{ borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0", padding: 14 }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>{item.title}</div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            {reviewPack.reviews.map((item) => (
              <div key={item.key} style={{ borderRadius: 18, border: "1px solid #e2e8f0", padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.author}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{item.date}</div>
                  </div>
                  <Tag icon={<StarOutlined />} color="gold" style={{ margin: 0, borderRadius: 999 }}>{item.tag}</Tag>
                </div>
                <Rate disabled value={item.rating} style={{ marginTop: 10, fontSize: 14 }} />
                <div style={{ marginTop: 8, fontWeight: 800, color: "#0f172a" }}>{item.title}</div>
                <div style={{ marginTop: 6, color: "#475569" }}>{item.text}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Tezkor kirishlar" style={{ borderRadius: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "grid", gap: 12 }}>
            {dealer.quickActions.map((action) => (
              <div key={action.key} style={{ borderRadius: 18, border: "1px solid #e2e8f0", padding: 14, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 900, color: "#0f172a" }}>{action.title}</div>
                  <div style={{ marginTop: 6, color: "#475569" }}>{action.text}</div>
                </div>
                <Button onClick={() => nav(action.route)} style={{ borderRadius: 14 }}>Ochish</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Marketplace quick hub" style={{ borderRadius: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "grid", gap: 12 }}>
            {hubCards.map((item) => (
              <div key={item.key} style={{ borderRadius: 18, border: "1px solid #e2e8f0", padding: 14, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                  <div style={{ marginTop: 6, color: "#475569" }}>{item.text}</div>
                </div>
                <Button onClick={() => nav(item.route)} style={{ borderRadius: 14 }}>Ochish</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
        <Card style={{ borderRadius: 20, border: "1px solid #e2e8f0", marginTop: 16 }} bodyStyle={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginBottom: 12 }}>
            {dealerActions.map((item) => (
              <div key={item.key} style={{ borderRadius: 16, border: `1px solid ${item.tone}22`, background: `${item.tone}10`, padding: 14 }}>
                {item.asset ? <img src={item.asset} alt={item.title} style={{ width: 42, height: 42, objectFit: "contain", marginBottom: 8 }} /> : null}
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{item.note}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>Dealer daraja yo‘li</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Verified’dan showroom elite darajagacha bo‘lgan ishonch signallari.</div>
            </div>
            <Tag color="processing" style={{ borderRadius: 999, margin: 0 }}>{dealerTier.title}</Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 14 }}>
            {tierLadder.map((item) => (
              <div key={item.key} style={{ borderRadius: 16, border: `1px solid ${item.tone}33`, background: item.active ? `${item.tone}14` : "#f8fafc", padding: 14 }}>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{item.note}</div>
                <Tag color={item.active ? "success" : "default"} style={{ borderRadius: 999, marginTop: 10 }}>{item.active ? "Faol daraja" : "Keyingi bosqich"}</Tag>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ borderRadius: 20, border: "1px solid #e2e8f0", marginTop: 16 }} bodyStyle={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <img src={inspectionCard.image} alt={inspectionCard.title} style={{ width: 82, height: 64, objectFit: "contain", borderRadius: 14, background: "#f8fafc", padding: 8 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{inspectionCard.title}</div>
                <Tag color="success" style={{ borderRadius: 999, margin: 0 }}>{inspectionCard.badge}</Tag>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{inspectionCard.note}</div>
            </div>
          </div>
        </Card>

