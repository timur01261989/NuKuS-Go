import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input, List, Space, Typography, Alert, Tag, Avatar, Empty } from "antd";
import { useLocation, useParams } from "react-router-dom";
import { createOrFindSupportThread, getSupportThread, sendSupportMessage } from "../../services/supportApi";
import { supabase } from "@/services/supabase/supabaseClient.js";
import { useLanguage } from "@/modules/shared/i18n/useLanguage";
import { supportAssets } from "@/assets/support";
import { orderAssets } from "@/assets/order";
import { assetSizes, assetStyles } from "@/assets/assetPolish";
import { integratedAssets } from "@/assets/integrated";
import { realtimeAssets } from "@/assets/realtime";
import Lottie from "lottie-react";
import { essentialsAssets } from "@/assets/essentials";

const { Title, Text } = Typography;

const ESSENTIAL_ACTIONS = [
  { key: "report", label: "Report", icon: essentialsAssets.support.supportReportDoc },
  { key: "video", label: "Video", icon: essentialsAssets.support.supportVideoReport },
  { key: "bug", label: "Bug", icon: essentialsAssets.support.supportBugDark },
];

const QUICK_ACTIONS = [
  { key: "phone", label: "Telefon", icon: realtimeAssets.support.supportCallQuick || orderAssets.chat.chatSupportPhone },
  { key: "link", label: "Havola", icon: realtimeAssets.chat.chatSupportLink || orderAssets.chat.chatSupportLink },
  { key: "ride", label: "Buyurtma", icon: realtimeAssets.chat.chatAttachmentRide || orderAssets.chat.chatAttachmentRide },
  { key: "location", label: "Joylashuv", icon: realtimeAssets.chat.chatAttachmentLocation || orderAssets.chat.chatAttachmentLocation },
];

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
  const { t } = useLanguage();

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
    if (!me) return;
    (async () => {
      const id = threadId || (await ensureThread());
      if (id) await refresh(id);
    })();
  }, [me, orderId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const messages = thread?.messages || thread?.data?.messages || [];

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Card size="small" style={{ borderRadius: 24, overflow: "hidden", border: "1px solid rgba(59,130,246,0.14)" }} styles={{ body: { padding: 0 } }}>
          <div style={{ position: "relative", padding: 18, background: "linear-gradient(135deg,#eff6ff 0%,#f8fafc 65%,#ffffff 100%)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(120px,160px)", gap: 16, alignItems: "center" }}>
              <div>
                <Space align="center" size={10}>
                  <Avatar src={realtimeAssets.chat.chatCreateThread || orderAssets.chat.chatCreate || supportAssets.chat.create || supportAssets.support.main} shape="square" size={assetSizes.supportAvatar} />
                  <Title level={3} style={{ marginBottom: 0 }}>{t.supportChatTitle}</Title>
                </Space>
                <div style={{ marginTop: 10 }}>
                  <Space size={[8, 8]} wrap>
                    <Tag>{t.orderLabel}: {orderId || "—"}</Tag>
                    <Tag color="blue">{t.roleLabel}: {senderRole}</Tag>
                    {threadId ? <Tag color="green">{t.threadLabel}: {threadId}</Tag> : null}
                  </Space>
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "#fff" }}>
                    <img src={integratedAssets.support.helpBadge} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Realtime chat</span>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "#fff" }}>
                    <img src={integratedAssets.support.chatMeta.time} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Thread synced</span>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "#fff" }}>
                    <img src={orderAssets.history.orderSupportAlt || orderAssets.history.orderSupport} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Call and chat ready</span>
                  </span>
                </div>
              </div>
              <div style={{ height: 132, width: "100%", maxWidth: 160, justifySelf: "center" }}>
                <Lottie animationData={integratedAssets.support.feedbackLike} loop autoplay style={{ height: "100%", width: "100%" }} />
              </div>
            </div>
          </div>
        </Card>

        {err ? <Alert type="error" showIcon message={err} /> : null}

        <Card size="small" style={{ borderRadius: 16 }} styles={{ body: { padding: 12 } }}>
          <Space wrap>
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.key}
                icon={<img src={action.icon} alt="" style={assetStyles.supportQuickIcon} />}
                onClick={() => setMsg((prev) => (prev ? `${prev} ` : "") + `[${action.label}]`)}
              >
                {action.label}
              </Button>
            ))}
          </Space>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <img src={realtimeAssets.chat.chatRatingStars || orderAssets.chat.chatRatingStars || supportAssets.chat.ratingStars} alt="" style={assetStyles.supportRatingStars} />
            <Space size={8} wrap>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: "#fafafa" }}>
                <img src={realtimeAssets.notifications.notifyFeedIcon || orderAssets.history.orderReceiptFill || orderAssets.history.orderReceipt} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>Chek</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: "#fafafa" }}>
                <img src={realtimeAssets.status.statusScheduleCheck || orderAssets.history.orderSchedule} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>Status</span>
              </span>
            </Space>
          </div>
        </Card>

        <Card styles={{ body: { padding: 0 } }}>
          <div style={{ maxHeight: 420, overflowY: "auto", padding: 12 }}>
            <List
              dataSource={messages}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span>{t.noMessages}</span>} /> }}
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
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <Text strong style={{ fontSize: 12 }}>
                            {mine ? t.you : roleLabel}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {it.created_at ? new Date(it.created_at).toLocaleString() : ""}
                          </Text>
                          {mine ? (
                            <img src={realtimeAssets.chat.chatMessageRead || orderAssets.chat.chatRead || supportAssets.chat.read} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />
                          ) : null}
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
            <Button onClick={() => setMsg((prev) => (prev ? `${prev} ` : "") + "[Support]")} icon={<img src={realtimeAssets.chat.chatAttach || orderAssets.chat.chatAttach} alt="" style={assetStyles.chatAction} />} />
            <Input
              placeholder={t.writeMessage}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onPressEnter={onSend}
              disabled={loading}
            />
            <Button type="primary" onClick={onSend} loading={loading}>
              <Space size={8}>
                <img src={msg.trim() ? (realtimeAssets.chat.chatSendMessage || orderAssets.chat.chatSend || supportAssets.chat.send) : (realtimeAssets.chat.chatSendMessageDisabled || orderAssets.chat.chatSendDisabled || supportAssets.chat.sendDisabled)} alt="" style={assetStyles.chatAction} />
                <span>{t.send}</span>
              </Space>
            </Button>
            <Button onClick={() => refresh()} disabled={!threadId || loading}>
              <Space size={8}>
                <img src={realtimeAssets.chat.chatRetryMessage || orderAssets.chat.chatRetry || supportAssets.chat.retry} alt="" style={assetStyles.chatAction} />
                <span>{t.refresh}</span>
              </Space>
            </Button>
          </Space.Compact>
        </Card>
      </Space>
    </div>
  );
}
