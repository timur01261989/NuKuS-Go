import React, { memo, useCallback, useEffect } from "react";
import { Alert, Button, Card, ConfigProvider, Result, Space, Typography } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  HomeOutlined,
  RedoOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const pageStyles = {
  minHeight: "100vh",
  padding: "24px 16px",
  background:
    "radial-gradient(circle at top left, rgba(6,182,212,0.15), transparent 25%), radial-gradient(circle at top right, rgba(59,130,246,0.16), transparent 30%), linear-gradient(180deg, #020617 0%, #0f172a 50%, #111827 100%)",
};

const shellStyles = {
  maxWidth: 980,
  margin: "0 auto",
};

const cardStyles = {
  borderRadius: 28,
  overflow: "hidden",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "rgba(15, 23, 42, 0.72)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.45)",
};

const heroStyles = {
  padding: 28,
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.94) 35%, rgba(8,145,178,0.88) 100%)",
  borderBottom: "1px solid rgba(148, 163, 184, 0.16)",
  color: "#ffffff",
};

const contentStyles = {
  padding: 24,
};

function DriverPending({
  status = "pending",
  rejectionReason = "",
  adminNote = "",
}) {
  useEffect(() => {
    if (status === "approved") {
      const timer = window.setTimeout(() => {
        window.location.assign("/driver");
      }, 1500);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [status]);

  const goClient = useCallback(() => {
    try {
      localStorage.removeItem("driverMode");
      localStorage.removeItem("driverActiveService");
      localStorage.removeItem("activeRole");
      localStorage.removeItem("selectedRole");
      localStorage.removeItem("currentRole");
      localStorage.removeItem("driverEntryPoint");
      localStorage.setItem("appMode", "client");

      sessionStorage.removeItem("driverMode");
      sessionStorage.removeItem("driverActiveService");
      sessionStorage.removeItem("activeRole");
      sessionStorage.removeItem("selectedRole");
      sessionStorage.removeItem("currentRole");
      sessionStorage.removeItem("driverEntryPoint");
      sessionStorage.setItem("appMode", "client");
    } catch (_error) {
      // storage access blocked bo'lsa ham client route ga o'tish davom etadi
    }

    window.location.assign("/client/home");
  }, []);

  const refreshStatus = useCallback(() => {
    window.location.reload();
  }, []);

  const isPending = status === "pending";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  const resultProps = isApproved
    ? {
        status: "success",
        icon: <CheckCircleOutlined style={{ color: "#22c55e" }} />,
        title: "Arizangiz tasdiqlandi",
        subTitle:
          "Sizning driver profilingiz tasdiqlandi. Bir necha soniyadan keyin driver kabinetga o'tasiz.",
      }
    : isRejected
    ? {
        status: "error",
        icon: <CloseCircleOutlined style={{ color: "#ef4444" }} />,
        title: "Arizangiz rad etildi",
        subTitle:
          "Sabab va admin izohini ko'rib chiqing. Tuzatib bo'lgach, arizani qayta topshirishingiz mumkin.",
      }
    : {
        status: "info",
        icon: <ClockCircleOutlined style={{ color: "#38bdf8" }} />,
        title: "Arizangiz tekshirilmoqda",
        subTitle:
          "Iltimos admin tasdig'ini kuting. Tasdiqlangandan so'ng sizga xabar yuboriladi.",
      };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#06b6d4",
          colorText: "#e2e8f0",
          colorTextHeading: "#f8fafc",
          colorBgContainer: "rgba(15, 23, 42, 0.92)",
          borderRadius: 16,
        },
      }}
    >
      <div style={pageStyles}>
        <div style={shellStyles}>
          <Card bordered={false} style={cardStyles} bodyStyle={{ padding: 0 }}>
            <div style={heroStyles}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.68)",
                    fontWeight: 800,
                    letterSpacing: 1.5,
                  }}
                >
                  DRIVER APPLICATION STATUS
                </Text>
                <Title level={2} style={{ color: "#ffffff", margin: 0 }}>
                  Haydovchi arizasi holati
                </Title>
                <Paragraph
                  style={{
                    color: "rgba(255,255,255,0.80)",
                    margin: 0,
                    maxWidth: 760,
                  }}
                >
                  Ariza statusi shu sahifada ko'rsatiladi.
                </Paragraph>
              </Space>
            </div>

            <div style={contentStyles}>
              <Result
                status={resultProps.status}
                icon={resultProps.icon}
                title={resultProps.title}
                subTitle={resultProps.subTitle}
              />

              {isPending ? (
                <Alert
                  type="info"
                  showIcon
                  message="Holat: pending"
                  description="Arizangiz tekshirilmoqda. Iltimos admin tasdig'ini kuting. Tasdiqlangandan so'ng sizga xabar yuboriladi."
                  style={{ borderRadius: 16, marginTop: 8 }}
                />
              ) : null}

              {isRejected ? (
                <Space direction="vertical" size={12} style={{ width: "100%", marginTop: 8 }}>
                  {rejectionReason ? (
                    <Alert
                      type="error"
                      showIcon
                      message="Rad etish sababi"
                      description={rejectionReason}
                      style={{ borderRadius: 16 }}
                    />
                  ) : null}

                  {adminNote ? (
                    <Alert
                      type="warning"
                      showIcon
                      message="Admin izohi"
                      description={adminNote}
                      style={{ borderRadius: 16 }}
                    />
                  ) : null}
                </Space>
              ) : null}

              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {isRejected ? (
                  <Button
                    type="primary"
                    icon={<RedoOutlined />}
                    onClick={() => window.location.reload()}
                  >
                    Qayta topshirish
                  </Button>
                ) : null}

                {isApproved ? (
                  <Button
                    type="primary"
                    icon={<HomeOutlined />}
                    onClick={() => window.location.assign("/driver")}
                  >
                    Driver kabinetga o'tish
                  </Button>
                ) : null}

                {!isApproved ? (
                  <>
                    <Button type="primary" onClick={refreshStatus}>
                      Holatni yangilash
                    </Button>
                    <Button onClick={goClient}>
                      Client rejimiga qaytish
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default memo(DriverPending);
