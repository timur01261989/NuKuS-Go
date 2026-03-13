import React, { useEffect, useMemo, useState } from "react";
import { Card, Divider, Empty, List, Spin, Tag, Typography, message } from "antd";
import { HeatMapOutlined, TrophyOutlined } from "@ant-design/icons";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "@/shared/i18n/useLanguage";
import { useDriverText } from "../shared/i18n_driverLocalize";
import DailyMissions from "../city-taxi/components/widgets/DailyMissions";

const { Title, Text } = Typography;

export default function DriverInsights() {
  const { t } = useLanguage();
  const { cp } = useDriverText();
  const [userId, setUserId] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id || null;
        if (mounted) setUserId(uid);
      } catch {
        // ignore
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  const loadHeatmap = async () => {
    if (!API_BASE) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/cron_heatmap?action=list&limit=50`, { method: "GET" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
      setHotspots(Array.isArray(j.hotspots) ? j.hotspots : []);
    } catch (e) {
      message.warning(e?.message || `${t.heatmapFailed} (FEATURE_HEATMAP)`);
      setHotspots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeatmap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  const top = useMemo(() => hotspots.slice(0, 12), [hotspots]);

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <Title level={3} style={{ marginBottom: 6 }}>{t.insights}</Title>
      <Text type="secondary">{`${t.heatmapHint} · ${t.dailyMissions}`}</Text>

      <Divider />

      <Card title={<span><HeatMapOutlined /> {t.heatmapTitle} ({t.heatmapHint})</span>} style={{ borderRadius: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
        ) : top.length === 0 ? (
          <Empty description={`${t.heatmapTitle} 0`} />
        ) : (
          <List
            dataSource={top}
            renderItem={(h) => (
              <List.Item>
                <div style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        {h.service_type || cp("unknown")} <Tag color="blue">{Number(h.demand_count || 0)}</Tag>
                      </div>
                      <div style={{ fontSize: 12, color: "#667085" }}>
                        {String(h.geokey || "")} • {Number(h.center_lat || 0).toFixed(4)}, {Number(h.center_lng || 0).toFixed(4)}
                      </div>
                    </div>
                    <Tag color="green">score: {Number(h.demand_score || 0)}</Tag>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
        <div style={{ marginTop: 12, fontSize: 12, color: "#667085" }}>
          {`${t.noteLabel}: ${t.heatmapNote}`}
        </div>
      </Card>

      <Divider />

      <Card title={<span><TrophyOutlined /> {t.dailyMissions}</span>} style={{ borderRadius: 16 }}>
        {userId ? (
          <DailyMissions userId={userId} visible={true} onClose={() => {}} />
        ) : (
          <Empty description={t.userNotFound} />
        )}
      </Card>
    </div>
  );
}
