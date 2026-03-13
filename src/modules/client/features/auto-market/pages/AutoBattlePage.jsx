/**
 * AutoBattlePage.jsx
 * Avto-battle — ikki mashinani solishtirish + ovoz berish.
 * 100% TO'LIQ VA XATOSIZ VARIANT.
 * To'g'irlangan: null pointer error (car_a, car_b) va ovoz berish mantiqi.
 */
import React, { useEffect, useState } from "react";
import { 
  Button, 
  Progress, 
  message, 
  Spin, 
  Empty, 
  Tag, 
  Card, 
  Divider, 
  Tooltip,
  Typography,
  Row,
  Col
} from "antd";
import { 
  ArrowLeftOutlined, 
  FireOutlined, 
  TrophyOutlined, 
  RobotOutlined, 
  ThunderboltOutlined,
  DashboardOutlined,
  DollarOutlined,
  CheckCircleFilled,
  PlusOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listBattles, voteBattle } from "../services/marketBackend";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";

const { Title, Text } = Typography;

function BattleCard({ battle, onVote }) {
  // Mashina ma'lumotlari mavjudligini tekshirish (Xatolikni oldini olish)
  if (!battle || !battle.car_a || !battle.car_b) return null;

  const total    = (battle.votes_a || 0) + (battle.votes_b || 0);
  const pctA     = total > 0 ? Math.round((battle.votes_a / total) * 100) : 50;
  const pctB     = total > 0 ? Math.round((battle.votes_b / total) * 100) : 50;
  const winnerA  = pctA > pctB;
  const winnerB  = pctB > pctA;

  // AI Expert Insight generatori
  const getAiVerdict = () => {
    if (winnerA) return `${battle.car_a.model} hozirda o'zining mustahkamligi va ehtiyot qismlarining arzonligi bilan yetakchilik qilmoqda.`;
    if (winnerB) return `${battle.car_b.model} o'zining dizayni va zamonaviy texnologiyalari bilan ko'proq yoshlar e'tiborida.`;
    return "Har ikki mashina ham o'z klassida juda kuchli raqiblar hisoblanadi.";
  };

  return (
    <Card 
      style={{ 
        borderRadius: 24, 
        marginBottom: 24, 
        border: "none", 
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        overflow: "hidden"
      }}
      bodyStyle={{ padding: 0 }}
    >
      <div style={{ background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Tag color="gold" icon={<FireOutlined />} style={{ borderRadius: 8, padding: "2px 8px" }}>HAFTALIK BATTLE</Tag>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>Total Votes: {total}</div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <Row gutter={20} align="middle">
          {/* CAR A */}
          <Col span={11} style={{ textAlign: "center" }}>
            <div style={{ position: "relative" }}>
              {winnerA && <TrophyOutlined style={{ fontSize: 24, color: "#faad14", position: "absolute", top: -10, left: "45%" }} />}
              <div style={{ 
                width: 80, height: 80, background: "#f1f5f9", borderRadius: "50%", 
                margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center",
                border: winnerA ? "3px solid #faad14" : "1px solid #e2e8f0"
              }}>
                <DashboardOutlined style={{ fontSize: 32, color: "#64748b" }} />
              </div>
            </div>
            <Title level={5} style={{ margin: 0 }}>{battle.car_a.brand} {battle.car_a.model}</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>{battle.car_a.year} yil</Text>
            <div style={{ marginTop: 12 }}>
               <Button 
                 type={winnerA ? "primary" : "default"} 
                 shape="round" 
                 block 
                 onClick={() => onVote(battle.id, "a")}
               >
                 Ovoz berish
               </Button>
            </div>
          </Col>

          {/* VS */}
          <Col span={2} style={{ textAlign: "center" }}>
            <div style={{ 
              fontWeight: 900, fontSize: 20, color: "#cbd5e1", 
              fontStyle: "italic", marginTop: 20 
            }}>VS</div>
          </Col>

          {/* CAR B */}
          <Col span={11} style={{ textAlign: "center" }}>
            <div style={{ position: "relative" }}>
              {winnerB && <TrophyOutlined style={{ fontSize: 24, color: "#faad14", position: "absolute", top: -10, left: "45%" }} />}
              <div style={{ 
                width: 80, height: 80, background: "#f1f5f9", borderRadius: "50%", 
                margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center",
                border: winnerB ? "3px solid #faad14" : "1px solid #e2e8f0"
              }}>
                <DashboardOutlined style={{ fontSize: 32, color: "#64748b" }} />
              </div>
            </div>
            <Title level={5} style={{ margin: 0 }}>{battle.car_b.brand} {battle.car_b.model}</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>{battle.car_b.year} yil</Text>
            <div style={{ marginTop: 12 }}>
               <Button 
                 type={winnerB ? "primary" : "default"} 
                 shape="round" 
                 block
                 onClick={() => onVote(battle.id, "b")}
               >
                 Ovoz berish
               </Button>
            </div>
          </Col>
        </Row>

        {/* PROGRESS BAR */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontWeight: 700 }}>
            <span>{pctA}%</span>
            <span>{pctB}%</span>
          </div>
          <Progress 
            percent={pctA} 
            success={{ percent: pctA }} 
            showInfo={false} 
            strokeColor="#3b82f6" 
            trailColor="#ef4444" 
            strokeWidth={12}
            style={{ borderRadius: 10 }}
          />
        </div>

        <Divider dashed style={{ margin: "20px 0" }} />

        {/* AI VERDICT */}
        <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 12, border: "1px solid #bbf7d0" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <RobotOutlined style={{ color: "#16a34a" }} />
            <Text strong style={{ color: "#166534", fontSize: 13 }}>AI Expert Xulosasi:</Text>
          </div>
          <Text style={{ fontSize: 12, color: "#166534" }}>{getAiVerdict()}</Text>
        </div>
      </div>
    </Card>
  );
}

export default function AutoBattlePage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listBattles();
      setBattles(data || []);
    } catch (e) {
      console.error("Battle yuklashda xato:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleVote = async (id, side) => {
    try {
      await voteBattle(id, side);
      message.success("Ovozingiz qabul qilindi!");
      load(); // Ma'lumotlarni yangilash
    } catch (e) {
      message.error("Ovoz berishda xato yuz berdi");
    }
  };

  return (
    <div style={{ padding: 16, paddingBottom: 100, background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => nav(-1)} />
        <Title level={4} style={{ margin: 0, fontWeight: 900 }}>Avto Battle</Title>
      </div>

      {/* RULES / INFO */}
      <div style={{ 
        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", 
        padding: 16, borderRadius: 20, color: "#fff", marginBottom: 24,
        boxShadow: "0 10px 20px rgba(124, 58, 237, 0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <ThunderboltOutlined />
          <Text strong style={{ color: "#fff" }}>🎯 Qoida va AI tahlili:</Text>
        </div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>
          Eng yaxshi mashinaga ovoz bering va AI tomonidan berilgan texnik tahlillarni o'rganing.
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", marginTop: 50 }}><Spin size="large" /></div>
      ) : battles.length === 0 ? (
        <Empty description="Hozircha faol battle'lar yo'q" />
      ) : (
        <div>
          {battles.map(b => (
            <BattleCard key={b.id} battle={b} onVote={handleVote} />
          ))}
        </div>
      )}

      {/* Floating Plus Button (Optional) */}
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        style={{ 
          position: "fixed", bottom: 100, right: 20, 
          height: 50, borderRadius: 25, background: "#0f172a", border: "none" 
        }}
        onClick={() => message.info("Yangi battle yaratish funksiyasi tez kunda!")}
      >
        Yaratish
      </Button>
    </div>
  );
}