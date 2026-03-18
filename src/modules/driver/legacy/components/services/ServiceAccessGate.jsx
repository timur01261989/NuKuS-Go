import React, { memo, useMemo } from "react";
import { Alert, Button, Card, Space, Typography } from "antd";
import { CarOutlined, SettingOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDriverOnline } from "@/modules/driver/legacy/core/useDriverOnline.js";

const { Title, Text } = Typography;

function ServiceAccessGateComponent({
  serviceKey,
  title,
  description,
  children,
}) {
  const navigate = useNavigate();
  const { activeVehicle, canUseService } = useDriverOnline();

  const serviceEnabled = useMemo(() => {
    try {
      return Boolean(canUseService?.(serviceKey));
    } catch {
      return false;
    }
  }, [canUseService, serviceKey]);

  const activeVehicleText = useMemo(() => {
    if (!activeVehicle) return "Aktiv mashina tanlanmagan";
    const parts = [
      activeVehicle.brand,
      activeVehicle.model,
      activeVehicle.vehicleType,
    ].filter(Boolean);
    const vehicleLabel = parts.join(" ").trim() || "Mashina";
    const weight = Number(activeVehicle.maxWeightKg || 0);
    const volume = Number(activeVehicle.maxVolumeM3 || 0);
    return `${vehicleLabel} • ${weight}kg • ${volume}m³`;
  }, [activeVehicle]);

  const goToSettings = () => navigate("/driver/settings?tab=services");
  const goToVehicles = () => navigate("/driver/vehicles");

  if (!serviceEnabled) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
        <Card style={{ borderRadius: 20 }} styles={{ body: { padding: 20 } }}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Title level={4} style={{ margin: 0 }}>{title}</Title>
            <Alert
              type="warning"
              showIcon
              message="Bu xizmat haydovchi sozlamalarida yoqilmagan"
              description={`${description} Bu bo‘limga kirish uchun avval shu hududdagi kerakli xizmat turini yoqing.`}
            />
            <Text type="secondary">Xizmat yoqish joyi: Sozlamalar → Xizmat turlari</Text>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button type="primary" icon={<SettingOutlined />} onClick={goToSettings}>
Haydovchi sozlamalari
              </Button>
            </div>
          </Space>
        </Card>
      </div>
    );
  }

  if (!activeVehicle) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
        <Card style={{ borderRadius: 20 }} styles={{ body: { padding: 20 } }}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Title level={4} style={{ margin: 0 }}>{title}</Title>
            <Alert
              type="info"
              showIcon
              message="Aktiv mashina tanlanmagan"
              description={`${description} Buyurtmalarni to‘g‘ri filtrlash uchun avval aktiv mashinani tanlash kerak.`}
            />
            <Text type="secondary">Hozirgi holat: {activeVehicleText}</Text>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button type="primary" icon={<CarOutlined />} onClick={goToVehicles}>
                Mashinalar bo‘limiga o‘tish
              </Button>
              <Button icon={<SettingOutlined />} onClick={goToSettings}>
Haydovchi sozlamalari
              </Button>
            </div>
          </Space>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

const ServiceAccessGate = memo(ServiceAccessGateComponent);

export default ServiceAccessGate;
