/**
 * AutoBattlePage.jsx
 * Avto-battle — ikki mashinani solishtirish + ovoz berish.
 * "Qaysi zo'r: Gentra 2023 yoki Monza?" — aktivlik va engagement uchun.
 */
import React, { useEffect, useState } from "react";
import { Button, Progress, message, Spin, Empty } from "antd";
import { ArrowLeftOutlined, FireOutlined, TrophyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listBattles, voteBattle } from "../services/marketApi";

function BattleCard({ battle, onVote }) {
  const total    = battle.votes_a + battle.votes_b;
  const pctA     = total > 0 ? Math.round((battle.votes_a / total) * 100) : 50;
  const pctB     = total > 0 ? Math.round((battle.votes_b / total) * 100) : 50;
  const winnerA  = pctA > pctB;
  const winnerB  = pctB > pctA;

  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:20,
      padding:16, boxShadow:"0 10px 30px rgba(2,6,23,.06)"
    }}>
      <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:14 }}>
        <FireOutlined style={{ color:"#ef4444", fontSize:16 }} />
        <div style={{ fontWeight:900, color:"#0f172a", flex:1 }}>{battle.title}</div>
        <div style={{ fontSize:11, color:"#94a3b8" }}>{total} ovoz</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:10, alignItems:"center" }}>
        {/* A tomoni */}
        <div
          onClick={() => onVote(battle.id, "a")}
          style={{
            background: winnerA ? "linear-gradient(135deg,#f0fdf4,#dcfce7)" : "#f8fafc",
            border: `2px solid ${winnerA ? "#22c55e" : "#e2e8f0"}`,
            borderRadius:16, padding:"14px 10px", textAlign:"center", cursor:"pointer",
            transition:"all .2s"
          }}
        >
          {winnerA && <TrophyOutlined style={{ color:"#eab308", fontSize:18, marginBottom:4, display:"block" }} />}
          <div style={{ fontWeight:900, fontSize:13, color:"#0f172a", lineHeight:1.3 }}>
            {battle.car_a_label}
          </div>
          <div style={{ marginTop:8, fontWeight:900, color: winnerA ? "#16a34a" : "#64748b", fontSize:20 }}>
            {battle.votes_a}
          </div>
          <div style={{ fontSize:11, color:"#64748b" }}>{pctA}%</div>
        </div>

        {/* VS */}
        <div style={{
          width:36, height:36, borderRadius:999, background:"linear-gradient(135deg,#7c3aed,#a855f7)",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#fff", fontWeight:900, fontSize:12, flexShrink:0,
          boxShadow:"0 8px 20px rgba(124,58,237,.3)"
        }}>VS</div>

        {/* B tomoni */}
        <div
          onClick={() => onVote(battle.id, "b")}
          style={{
            background: winnerB ? "linear-gradient(135deg,#eff6ff,#dbeafe)" : "#f8fafc",
            border: `2px solid ${winnerB ? "#3b82f6" : "#e2e8f0"}`,
            borderRadius:16, padding:"14px 10px", textAlign:"center", cursor:"pointer",
            transition:"all .2s"
          }}
        >
          {winnerB && <TrophyOutlined style={{ color:"#eab308", fontSize:18, marginBottom:4, display:"block" }} />}
          <div style={{ fontWeight:900, fontSize:13, color:"#0f172a", lineHeight:1.3 }}>
            {battle.car_b_label}
          </div>
          <div style={{ marginTop:8, fontWeight:900, color: winnerB ? "#2563eb" : "#64748b", fontSize:20 }}>
            {battle.votes_b}
          </div>
          <div style={{ fontSize:11, color:"#64748b" }}>{pctB}%</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:4 }}>
        <span style={{ fontSize:10, color:"#22c55e", fontWeight:800 }}>A</span>
        <div style={{ flex:1, height:8, background:"#e2e8f0", borderRadius:999, overflow:"hidden" }}>
          <div style={{
            height:"100%", width:`${pctA}%`,
            background:"linear-gradient(90deg,#22c55e,#16a34a)",
            borderRadius:999, transition:"width .5s"
          }} />
        </div>
        <span style={{ fontSize:10, color:"#3b82f6", fontWeight:800 }}>B</span>
      </div>
    </div>
  );
}

export default function AutoBattlePage() {
  const nav = useNavigate();
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setBattles(await listBattles()); }
    catch { setBattles([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onVote = async (battleId, choice) => {
    try {
      const updated = await voteBattle(battleId, choice);
      setBattles(prev => prev.map(b => String(b.id) === String(battleId) ? updated : b));
      message.success("✅ Ovozingiz qabul qilindi!");
    } catch (e) {
      message.warning(e.message || "Xatolik");
    }
  };

  return (
    <div style={{ padding:"14px 14px 90px" }}>
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius:14 }} />
        <div>
          <div style={{ fontWeight:950, fontSize:18, color:"#0f172a" }}>⚔️ Avto-Battle</div>
          <div style={{ fontSize:11, color:"#64748b" }}>Qaysi mashina zo'r? Ovoz bering!</div>
        </div>
      </div>

      <div style={{ background:"#faf5ff", borderRadius:14, padding:12, marginBottom:16, border:"1.5px solid #e9d5ff" }}>
        <div style={{ fontWeight:800, color:"#7c3aed" }}>🎯 Qoida:</div>
        <div style={{ fontSize:12, color:"#6b21a8", marginTop:4, lineHeight:1.5 }}>
          Mashinani bosib ovoz bering. Har bir battle'da faqat bir marta ovoz berishingiz mumkin.
        </div>
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spin size="large" /></div>
      ) : battles.length === 0 ? (
        <Empty description="Hozircha battle yo'q" style={{ marginTop:40 }} />
      ) : (
        <div style={{ display:"grid", gap:16 }}>
          {battles.map(b => <BattleCard key={b.id} battle={b} onVote={onVote} />)}
        </div>
      )}
    </div>
  );
}
