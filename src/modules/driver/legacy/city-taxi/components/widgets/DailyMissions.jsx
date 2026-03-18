/**
 * DailyMissions.jsx
 * Kunlik missiyalar paneli — haydovchi uchun.
 * Drawer ichida yoki to'g'ridan-to'g'ri ko'rsatiladi.
 *
 * Props:
 *  - userId: string
 *  - visible: boolean
 *  - onClose: () => void
 */
import React, { useEffect, useState, useCallback } from "react";
import { Drawer, Progress, Tag, Button, Skeleton, Empty, Typography } from "antd";
import { TrophyOutlined, ReloadOutlined } from "@ant-design/icons";
import { getDriverStatus } from "@/services/gamificationApi";

const { Text } = Typography;

function MissionCard({ mission }) {
  const percent = mission.target_value > 0
    ? Math.min(100, Math.round((mission.current_value / mission.target_value) * 100))
    : 0;

  const targetLabel = {
    trips: `${mission.current_value}/${mission.target_value} ta safar`,
    earnings: `${Number(mission.current_value || 0).toLocaleString("uz-UZ")} / ${Number(mission.target_value).toLocaleString("uz-UZ")} so'm`,
    streak: `${mission.current_value}/${mission.target_value} kun`,
    rating: `Reyting: ${mission.current_value || "—"}`,
  }[mission.target_type] || `${mission.current_value}/${mission.target_value}`;

  return (
    <div style={{
      background: mission.completed ? "#f6ffed" : "#fff",
      border: `1.5px solid ${mission.completed ? "#52c41a" : "#e2e8f0"}`,
      borderRadius: 16,
      padding: "14px 16px",
      marginBottom: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#111", marginBottom: 2 }}>
            {mission.completed ? "✅ " : ""}{mission.title}
          </div>
          {mission.description && (
            <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{mission.description}</div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {mission.bonus_uzs > 0 && (
            <Tag color="green" style={{ margin: "0 0 4px 0", display: "block" }}>
              +{Number(mission.bonus_uzs).toLocaleString("uz-UZ")} so'm
            </Tag>
          )}
          {mission.bonus_points > 0 && (
            <Tag color="gold" style={{ margin: 0 }}>
              +{mission.bonus_points} ball
            </Tag>
          )}
        </div>
      </div>

      <Progress
        percent={percent}
        size="small"
        strokeColor={mission.completed ? "#52c41a" : "#FFD700"}
        showInfo={false}
        style={{ marginBottom: 4 }}
      />
      <Text style={{ fontSize: 11, color: "#888" }}>{targetLabel}</Text>

      {mission.level_name && (
        <Tag style={{ marginTop: 6, fontSize: 10 }}>{mission.level_name} darajasi uchun</Tag>
      )}
    </div>
  );
}

export default function DailyMissions({ userId, visible, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    getDriverStatus(userId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const missions = data?.missions || [];
  const gamif = data?.gamification;
  const level = data?.current_level;

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TrophyOutlined style={{ color: "#FFD700", fontSize: 20 }} />
          <span style={{ fontWeight: 900 }}>Kunlik missiyalar</span>
          {!loading && missions.length > 0 && (
            <Tag color="blue" style={{ marginLeft: 4 }}>
              {completedCount}/{missions.length}
            </Tag>
          )}
        </div>
      }
      placement="bottom"
      height="80vh"
      open={visible}
      onClose={onClose}
      extra={
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading} size="small">
          Yangilash
        </Button>
      }
      styles={{ body: { padding: "16px 16px 40px" } }}
    >
      {/* Haydovchi daraja va bonus balllar */}
      {gamif && level && (
        <div style={{
          background: "linear-gradient(135deg, #111 0%, #333 100%)",
          color: "#fff",
          borderRadius: 18,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Daraja</div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{level.badge_emoji} {level.name}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
              Jami {gamif.total_trips} ta safar • {gamif.streak_days} kun ketma-ket
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Bonus balllar</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: "#FFD700" }}>
              {gamif.bonus_points || 0}
            </div>
          </div>
        </div>
      )}

      {/* Missiyalar */}
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : missions.length === 0 ? (
        <Empty description="Hozircha aktiv missiyalar yo'q" style={{ marginTop: 40 }} />
      ) : (
        <>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#888", marginBottom: 12 }}>
            BUGUNGI MISSIYALAR
          </div>
          {missions.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
        </>
      )}
    </Drawer>
  );
}
