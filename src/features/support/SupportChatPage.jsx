import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input, List, Space, Typography, Alert, Tag } from "antd";
import { useLocation, useParams } from "react-router-dom";
import { createOrFindSupportThread, getSupportThread, sendSupportMessage } from "../../services/supportApi";
import { supabase } from "../../lib/supabase";

const { Title, Text } = Typography;

/**
 * SupportChatPage (additive)
 * URL patterns:
 * - /client/support/:orderId
 * - /driver/support/:orderId
 *
 * Notes:
 * - Uses current Supabase auth user.
 * - Server-side support API uses SERVICE_ROLE, so no RLS headaches.
 */
export default function SupportChatPage({ role, orderId: orderIdProp }) {
  const { orderId: orderIdParam } = useParams();
  const orderId = orderIdProp || orderIdParam;
  const location = useLocation();
  const qp = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialThreadId = qp.get("thread");

  const [me, setMe] = useState(null);
  const [threadId, setThreadId] = useState(initialThreadId || "");
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const bottomRef = useRef(null);

  const senderRole = role || (location.pathname.startsWith("/driver") ? "driver" : "client");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!cancelled) setMe(data?.user || null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function ensureThread() {
    setErr("");
    setLoading(true);
    try {
      const user_id = me?.id || null;
      const payload = {
        order_id: orderId || null,
        user_id: senderRole === "client" ? user_id : null,
        driver_id: senderRole === "driver" ? user_id : null,
      };
      const res = await createOrFindSupportThread(payload);
      if (!res?.ok) throw new Error(res?.error || "support/thread failed");
      const id = res.thread_id || res.thread?.id || res.data?.thread_id;
      if (!id) throw new Error("thread_id missing");
      setThreadId(id);
      return id;
    } catch (e) {
      setErr(String(e?.message || e));
      return "";
    } finally {
      setLoading(false);
    }
  }

  async function refresh(tid) {
    const id = tid || threadId;
    if (!id) return;
    setErr("");
    const res = await getSupportThread(id);
    if (!res?.ok) {
      setErr(res?.error || "support/thread read failed");
      return;
    }
    setThread(res.thread || res.data?.thread || res);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  useEffect(() => {
    // auto-create thread if missing
    if (!me) return;
    (async () => {
      const id = threadId || (await ensureThread());
      if (id) await refresh(id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, orderId]);

  async function onSend() {
    const text = msg.trim();
    if (!text || !me) return;
    setErr("");
    setLoading(true);
    try {
      const id = threadId || (await ensureThread());
      if (!id) throw new Error("No thread");
      const res = await sendSupportMessage({
        thread_id: id,
        sender_role: senderRole,
        sender_id: me.id,
        message: text,
      });
      if (!res?.ok) throw new Error(res?.error || "support/message failed");
      setMsg("");
      await refresh(id);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div>
          <Title level={3} style={{ marginBottom: 0 }}>
            Support Chat
          </Title>
          <Space size={8}>
            <Text type="secondary">Order:</Text>
            <Tag>{orderId || "—"}</Tag>
            <Text type="secondary">Role:</Text>
            <Tag color="blue">{senderRole}</Tag>
            {threadId ? (
              <>
                <Text type="secondary">Thread:</Text>
                <Tag color="green">{threadId}</Tag>
              </>
            ) : null}
          </Space>
        </div>

        {err ? <Alert type="error" showIcon message={err} /> : null}

        <Card bodyStyle={{ padding: 0 }}>
          <div style={{ maxHeight: 420, overflowY: "auto", padding: 12 }}>
            <List
              dataSource={thread?.messages || thread?.data?.messages || []}
              locale={{ emptyText: "Hozircha xabar yo‘q" }}
              renderItem={(it) => {
                const mine = (it.sender_id || it.senderId) === me?.id;
                const roleLabel = it.sender_role || it.senderRole || "user";
                return (
                  <List.Item style={{ border: "none", padding: "6px 0" }}>
                    <div style={{ width: "100%", display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                      <div
                        style={{
                          maxWidth: "78%",
                          borderRadius: 12,
                          padding: "8px 10px",
                          background: mine ? "#e6f4ff" : "#f5f5f5",
                        }}
                      >
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <Text strong style={{ fontSize: 12 }}>
                            {mine ? "You" : roleLabel}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {it.created_at ? new Date(it.created_at).toLocaleString() : ""}
                          </Text>
                        </div>
                        <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{it.message || it.text}</div>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
            <div ref={bottomRef} />
          </div>
        </Card>

        <Card>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              placeholder="Xabar yozing…"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onPressEnter={onSend}
              disabled={loading}
            />
            <Button type="primary" onClick={onSend} loading={loading}>
              Yuborish
            </Button>
            <Button onClick={() => refresh()} disabled={!threadId || loading}>
              Yangilash
            </Button>
          </Space.Compact>
        </Card>
      </Space>
    </div>
  );
}
