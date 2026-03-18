import React from "react";
import { Button, Result, Card, Skeleton, Typography } from "antd";
import { ClockCircleOutlined, StopOutlined, ReloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export function normalizeDriverStatus(raw) {
  if (!raw) return "none";
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : raw;
  if (v === "loading" || v === "none" || v === "pending" || v === "active" || v === "blocked" || v === "need_login") return v;
  if (v === true || v === 1) return "active";
  if (v === false || v === 0) return "pending";
  if (["approved", "verified", "enabled", "ok"].includes(v)) return "active";
  if (["inactive", "disabled", "banned", "ban", "blocked_by_admin"].includes(v)) return "blocked";
  if (["review", "checking", "awaiting", "waiting", "new"].includes(v)) return "pending";
  return "pending";
}

export function DriverAuthLoadingCard() {
  return (
    <Card style={{ borderRadius: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}>
      <Skeleton active paragraph={{ rows: 4 }} />
    </Card>
  );
}

export function DriverAuthLoginRequired({ onBack, onLogin, loading }) {
  return (
    <Result
      status="info"
      title="Avval tizimga kiring"
      subTitle="Haydovchi holatini tekshirish uchun avval akkauntga kirish kerak."
      extra={[
        <Button key="back" icon={<ArrowLeftOutlined />} onClick={onBack}>Orqaga</Button>,
        <Button key="login" type="primary" loading={loading} onClick={onLogin}>Kirish</Button>,
      ]}
    />
  );
}

export function DriverAuthPendingCard({ onRefresh, loading }) {
  return (
    <Result
      icon={<ClockCircleOutlined />}
      title="Arizangiz ko‘rib chiqilmoqda"
      subTitle="Ma’lumotlaringiz tekshiruvdan o‘tayapti. Birozdan keyin qayta tekshirib ko‘ring."
      extra={<Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>Yangilash</Button>}
    />
  );
}

export function DriverAuthBlockedCard({ onRefresh, loading }) {
  return (
    <Result
      status="error"
      icon={<StopOutlined />}
      title="Hisob bloklangan"
      subTitle="Profilingiz vaqtincha cheklangan. Zarur bo‘lsa qo‘llab-quvvatlash bilan bog‘laning."
      extra={<Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>Qayta tekshirish</Button>}
    />
  );
}
