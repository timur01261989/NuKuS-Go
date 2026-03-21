import React from "react";
import { Button, Result, Card, Typography } from "antd";
import DriverHome from "./DriverHome";
import DriverRegister from "./DriverRegister";
import {
  DriverAuthLoadingCard,
  DriverAuthLoginRequired,
  DriverAuthPendingCard,
  DriverAuthBlockedCard,
} from "./driverAuth.helpers.jsx";
import { useDriverAuthController } from "./useDriverAuthController.js";

const { Title, Text } = Typography;

export default function DriverAuth({ onBack }) {
  const {
    status,
    loading,
    checkDriverStatus,
    handleLoginRedirect,
    handleRetry,
  } = useDriverAuthController({ onBack });

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0b1020] px-4 py-8">
        <div className="mx-auto max-w-[520px]">
          <DriverAuthLoadingCard />
        </div>
      </div>
    );
  }

  if (status === "need_login") {
    return (
      <div className="min-h-screen bg-[#0b1020] px-4 py-8">
        <div className="mx-auto max-w-[720px] space-y-4">
          <DriverAuthLoginRequired
            onBack={onBack}
            onLogin={handleLoginRedirect}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  if (status === "none") {
    return <DriverRegister onSuccess={checkDriverStatus} onBack={onBack} />;
  }

  if (status === "pending") {
    return (
      <div className="min-h-screen bg-[#0b1020] px-4 py-8">
        <div className="mx-auto max-w-[720px] space-y-4">
          <DriverAuthPendingCard loading={loading} onRetry={handleRetry} onBack={onBack} />
        </div>
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="min-h-screen bg-[#0b1020] px-4 py-8">
        <div className="mx-auto max-w-[720px] space-y-4">
          <DriverAuthBlockedCard loading={loading} onRetry={handleRetry} onBack={onBack} />
        </div>
      </div>
    );
  }

  if (status === "active") {
    return <DriverHome onLogout={handleLoginRedirect} />;
  }

  return (
    <div className="min-h-screen bg-[#0b1020] px-4 py-8">
      <div className="mx-auto max-w-[720px] space-y-4">
        <Card style={{ borderRadius: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}>
          <Result
            status="warning"
            title="Haydovchi holati noma'lum"
            subTitle="Haydovchi holatini qayta tekshirib ko‘ring."
            extra={[
              <Button key="retry" type="primary" loading={loading} onClick={handleRetry}>
                Qayta tekshirish
              </Button>,
            ]}
          />
          <div style={{ marginTop: 16 }}>
            <Title level={5} style={{ marginBottom: 8 }}>Eslatma</Title>
            <Text type="secondary">
              Agar muammo davom etsa, qayta ro‘yxatdan o‘tish yoki administrator bilan bog‘lanish kerak bo‘lishi mumkin.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
