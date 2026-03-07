/**
 * AutoBattlePage.jsx
 * Avto-battle — ikki mashinani solishtirish + ovoz berish.
 * YANGI QO'SHILDI: AI Expert Analysis, Specs Comparison, Leader Badges.
 */
import React, { useEffect, useState } from "react";
import { Button, Progress, message, Spin, Empty, Tag, Card, Divider, Tooltip } from "antd";
import { 
  ArrowLeftOutlined, 
  FireOutlined, 
  TrophyOutlined, 
  RobotOutlined, 
  ThunderboltOutlined,
  DashboardOutlined,
  DollarOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listBattles, voteBattle } from "../services/marketBackend";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";

function BattleCard({ battle, onVote }) {
  const total    = battle.votes_a + battle.votes_b;
  const pctA     = total > 0 ? Math.round((battle.votes_a / total) * 100) : 50;
  const pctB     = total > 0 ? Math.round((battle.votes_b / total) * 100) : 50;
  const winnerA  = pctA > pctB;
  const winnerB  = pctB > pctA;

  // AI Expert Insight generatori (Simulation)
  const getAiVerdict = () => {
    if (winnerA) return `${battle.car_a.model} hozirda o'zining mustahkamligi va ehtiyot qismlari arzonligi bilan foydalanuvchilar ishonchini ko'proq qozonmoqda.`;
    if (winnerB) return `${battle.car_b.model} o'zining zamonaviy dizayni va innovatsion saloni bilan yoshlar orasida ommalashib bormoqda.`;
    return "Ikkala mashina ham o'z klassida juda kuchli. Tanlov sizning ehtiyojlaringizga bog'liq.";
  };

  return (
    <Card style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24,
      padding: 4, marginBottom: 20, boxShadow: "0 10px 30px rgba(2,6,23,.04)"
    }} bodyStyle={{ padding: 16 }}>
      
      {/* Header with Fire Icon */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Tag color="volcano" icon={<FireOutlined />} style={{ borderRadius: 10, padding: "2px 10px" }}>Qizg'in bahs</Tag>
        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{total} ovoz to'plandi</div>
      </div>

      {/* Main Battle Area */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Car A */}
        <div style={{ flex: 1, textAlign: "center", position: 'relative' }}>
          {winnerA && <TrophyOutlined style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', color: '#f59e0b', fontSize: 24, zIndex: 1 }} />}
          <div 
            onClick={() => onVote(battle.id, 'a')}
            style={{ 
                cursor: "pointer", 
                borderRadius: 20, 
                overflow: "hidden", 
                border: winnerA ? "3px solid #f59e0b" : "1px solid #e2e8f0",
                transition: "all 0.3s"
            }}
          >
            <img src={battle.car_a.image} alt="" style={{ width: "100%", height: 100, objectFit: "cover" }} />
          </div>
          <div style={{ fontWeight: 800, marginTop: 8, fontSize: 13, height: 32 }}>{battle.car_a.model}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: winnerA ? "#f59e0b" : "#64748b" }}>{pctA}%</div>
        </div>

        <div style={{ alignSelf: "center", fontWeight: 950, fontSize: 20, color: "#cbd5e1", marginTop: -20 }}>VS</div>

        {/* Car B */}
        <div style={{ flex: 1, textAlign: "center", position: 'relative' }}>
          {winnerB && <TrophyOutlined style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', color: '#f59e0b', fontSize: 24, zIndex: 1 }} />}
          <div 
            onClick={() => onVote(battle.id, 'b')}
            style={{ 
                cursor: "pointer", 
                borderRadius: 20, 
                overflow: "hidden", 
                border: winnerB ? "3px solid #f59e0b" : "1px solid #e2e8f0",
                transition: "all 0.3s"
            }}
          >
            <img src={battle.car_b.image} alt="" style={{ width: "100%", height: 100, objectFit: "cover" }} />
          </div>
          <div style={{ fontWeight: 800, marginTop: 8, fontSize: 13, height: 32 }}>{battle.car_b.model}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: winnerB ? "#f59e0b" : "#64748b" }}>{pctB}%</div>
        </div>
      </div>

      <Progress 
        percent={pctA} 
        success={{ percent: 0 }} 
        showInfo={false} 
        strokeColor={winnerA ? "#f59e0b" : "#e2e8f0"}
        trailColor={winnerB ? "#f59e0b" : "#e2e8f0"}
        style={{ marginTop: 15 }}
      />

      {/* YANGI: Texnik Solishtirish Jadvali */}
      <div style={{ marginTop: 20, background: "#f8fafc", borderRadius: 16, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', flex: 1 }}>{battle.car_a.year}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', flex: 1, textAlign: 'center' }}>Yili</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', flex: 1, textAlign: 'right' }}>{battle.car_b.year}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', flex: 1 }}>{battle.car_a.mileage}k</div>
              <div style={{ fontSize: 11, color: '#94a3b8', flex: 1, textAlign: 'center' }}>Probeg</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', flex: 1, textAlign: 'right' }}>{battle.car_b.mileage}k</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#10b981', flex: 1 }}>${battle.car_a.price?.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', flex: 1, textAlign: 'center' }}>Narxi</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#10b981', flex: 1, textAlign: 'right' }}>${battle.car_b.price?.toLocaleString()}</div>
          </div>
      </div>

      {/* YANGI: AI Ekspert Tahlili */}
      <div style={{ marginTop: 16, padding: 12, background: "#f0f7ff", borderRadius: 16, border: "1px dashed #bae0ff" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <RobotOutlined style={{ color: '#2563eb' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#1e40af' }}>AI Ekspert Xulosasi:</span>
          </div>
          <div style={{ fontSize: 11, color: "#334155", lineHeight: 1.4 }}>
              {getAiVerdict()}
          </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Button 
            type={winnerA ? "primary" : "default"} 
            onClick={() => onVote(battle.id, 'a')}
            style={{ borderRadius: 12, height: 40, fontWeight: 700, borderColor: winnerA ? "#f59e0b" : "#d1d5db", background: winnerA ? "#f59e0b" : "#fff" }}
        >
          {battle.car_a.model}
        </Button>
        <Button 
            type={winnerB ? "primary" : "default"} 
            onClick={() => onVote(battle.id, 'b')}
            style={{ borderRadius: 12, height: 40, fontWeight: 700, borderColor: winnerB ? "#f59e0b" : "#d1d5db", background: winnerB ? "#f59e0b" : "#fff" }}
        >
          {battle.car_b.model}
        </Button>
      </div>
    </Card>
  );
}

export default function AutoBattlePage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listBattles();
      setBattles(data || []);
    } catch (e) {
      message.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (battleId, option) => {
    try {
      const updated = await voteBattle(battleId, option);
      setBattles(prev => prev.map(b => String(b.id) === String(battleId) ? updated : b));
      message.success("✅ Ovozingiz qabul qilindi!");
    } catch (e) {
      message.warning(e.message || "Xatolik");
    }
  };

  return (
    <div style={{ padding: "14px 14px 90px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} style={{ borderRadius: 14, height: 44, width: 44 }} />
        <div>
          <div style={{ fontWeight: 950, fontSize: 20, color: "#0f172a" }}>⚔️ Avto-Battle</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Qaysi mashina zo'r? Xalq tanlovi!</div>
        </div>
      </div>

      {/* Rules Banner with AI Icon */}
      <div style={{ 
          background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", 
          borderRadius: 20, 
          padding: 16, 
          marginBottom: 20, 
          color: "#fff",
          boxShadow: "0 10px 20px rgba(124, 58, 237, 0.2)"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <ThunderboltOutlined />
            <div style={{ fontWeight: 800, fontSize: 14 }}>🎯 Qoida va AI tahlili:</div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.5 }}>
          Ovoz bering va mashinalarning real vaqtdagi texnik solishtiruvini hamda AI xulosasini ko'ring.
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spin size="large" /></div>
      ) : battles.length === 0 ? (
        <Empty description="Hozircha faol battle'lar yo'q" style={{ marginTop: 50 }} />
      ) : (
        <div>
          {battles.map(b => (
            <BattleCard key={b.id} battle={b} onVote={handleVote} />
          ))}
        </div>
      )}

      {/* Floating Action for Creating Battle (Optional Idea) */}
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        style={{ 
            position: 'fixed', 
            bottom: 100, 
            right: 20, 
            height: 50, 
            borderRadius: 25, 
            background: '#0f172a', 
            border: 'none',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
        }}
      >
        Battle yaratish
      </Button>
    </div>
  );
}

// Qo'shimcha ikonka uchun
function PlusOutlined() {
    return <span style={{ fontSize: 20, fontWeight: 'bold' }}>+</span>;
}