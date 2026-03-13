/**
 * LevelBadge.jsx
 * Haydovchi darajasini ko'rsatuvchi badge.
 * TopStatusPanel ichida ishlaydi.
 *
 * Props:
 *  - userId: string (Supabase auth user id)
 *  - compact: boolean (kichik ixcham versiya)
 */
import React, { useEffect, useState } from "react";
import { Tooltip, Progress } from "antd";
import { getDriverStatus } from "@/services/gamificationApi";

export default function LevelBadge({ userId, compact = false }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getDriverStatus(userId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  if (!data) return null;

  const level = data.current_level;
  const nextLevel = data.next_level;
  const gamif = data.gamification;

  if (!level) return null;

  // Progress keyingi darajaga qarab
  let progress = 100;
  if (nextLevel) {
    const range = nextLevel.min_trips - level.min_trips;
    const done = (gamif?.total_trips || 0) - level.min_trips;
    progress = range > 0 ? Math.min(100, Math.round((done / range) * 100)) : 100;
  }

  if (compact) {
    return (
      <Tooltip
        title={
          <div>
            <div style={{ fontWeight: 700 }}>{level.badge_emoji} {level.name} darajasi</div>
            <div>Jami safarlar: {gamif?.total_trips || 0}</div>
            {nextLevel && (
              <div style={{ marginTop: 4 }}>
                Keyingi: {nextLevel.badge_emoji} {nextLevel.name} — yana {Math.max(0, nextLevel.min_trips - (gamif?.total_trips || 0))} ta safar
              </div>
            )}
            <div>Komissiya: {Math.round((level.commission_rate || 0.15) * 100)}%</div>
          </div>
        }
        placement="bottom"
      >
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: level.badge_color + "22",
          border: `1.5px solid ${level.badge_color}`,
          borderRadius: 999,
          padding: "3px 10px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 800,
          color: level.badge_color,
          userSelect: "none",
        }}>
          <span>{level.badge_emoji}</span>
          <span>{level.name}</span>
        </div>
      </Tooltip>
    );
  }

  // To'liq versiya
  return (
    <div style={{
      background: "rgba(255,255,255,0.97)",
      borderRadius: 18,
      padding: "12px 16px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
      minWidth: 200,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 26 }}>{level.badge_emoji}</span>
        <div>
          <div style={{ fontWeight: 900, fontSize: 15, color: level.badge_color }}>{level.name}</div>
          <div style={{ fontSize: 11, color: "#888" }}>Komissiya {Math.round((level.commission_rate || 0.15) * 100)}%</div>
        </div>
      </div>

      {nextLevel && (
        <>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
            {nextLevel.badge_emoji} {nextLevel.name} uchun: {Math.max(0, nextLevel.min_trips - (gamif?.total_trips || 0))} ta safar qoldi
          </div>
          <Progress
            percent={progress}
            size="small"
            strokeColor={level.badge_color}
            showInfo={false}
            style={{ margin: 0 }}
          />
        </>
      )}

      {!nextLevel && (
        <div style={{ fontSize: 11, color: "#52c41a", fontWeight: 700 }}>
          ✅ Eng yuqori daraja!
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 11, color: "#888" }}>
        Bonus: {level.bonus_multiplier || 1}x ball
        {level.priority_dispatch && (
          <span style={{ marginLeft: 8, color: "#FFD700", fontWeight: 700 }}>⚡ Ustuvor buyurtmalar</span>
        )}
      </div>
    </div>
  );
}
