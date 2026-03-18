import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Input, List, Space, Tag, Typography } from "antd";
import { listFraudFlags } from "../../services/fraudApi";

const { Title, Text } = Typography;

export default function FraudFlagsPanel() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [limit, setLimit] = useState(50);
  const [entityType, setEntityType] = useState("");
  const [rows, setRows] = useState([]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await listFraudFlags({ limit, entity_type: entityType || undefined });
      if (!res?.ok) throw new Error(res?.error || "fraud list failed");
      setRows(res.flags || res.data || []);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 12 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Title level={4} style={{ margin: 0 }}>
          Fraud Flags
        </Title>
        <Text type="secondary">Manba: /api/fraud?action=list (FEATURE_ANTIFRAUD_WRITE=true bo‘lsa real yoziladi)</Text>

        {err ? <Alert type="error" showIcon message={err} /> : null}

        <Card size="small">
          <Space wrap>
            <Input
              style={{ width: 220 }}
              placeholder="entity_type (order/user/driver)"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            />
            <Input
              style={{ width: 120 }}
              placeholder="limit"
              value={String(limit)}
              onChange={(e) => setLimit(Number(e.target.value || 50))}
            />
            <Button onClick={load} loading={loading} type="primary">
              Reload
            </Button>
          </Space>
        </Card>

        <Card size="small" styles={{ body: { padding: 0 } }}>
          <List
            loading={loading}
            dataSource={rows || []}
            locale={{ emptyText: "No flags yet" }}
            renderItem={(it) => (
              <List.Item style={{ padding: "10px 12px" }}>
                <Space direction="vertical" size={2} style={{ width: "100%" }}>
                  <Space wrap>
                    <Tag color="red">{it.score ?? "?"}</Tag>
                    <Tag>{it.entity_type || "entity"}</Tag>
                    <Text copyable>{it.entity_id || ""}</Text>
                    <Tag color="gold">{it.reason || "—"}</Tag>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {it.created_at ? new Date(it.created_at).toLocaleString() : ""}
                  </Text>
                  {it.meta ? (
                    <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>
{typeof it.meta === "string" ? it.meta : JSON.stringify(it.meta, null, 2)}
                    </pre>
                  ) : null}
                </Space>
              </List.Item>
            )}
          />
        </Card>
      </Space>
    </div>
  );
}
