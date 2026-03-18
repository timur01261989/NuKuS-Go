import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Row,
  Popconfirm,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CarOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import PageBackButton from "@/modules/shared/components/PageBackButton";
import { getDefaultServiceTypes, getVehiclePreset } from "@/modules/driver/registration/uploadConfig.js";
import {
  CARD_STYLE,
  SECTION_LABEL_STYLE,
  normalizeServiceTypes,
  safeSelectDriverServiceSettings,
  safeSelectVehicleRequests,
  safeSelectVehicles,
  vehicleRowToUi,
} from "./driverSettings.helpers";
import { ServiceTypesEditor, VehicleCard, VehicleRequestModal } from "./driverSettings.sections";
import { buildRegisterSummary } from "./driverSettings.logic.js";
import { useDriverSettingsController } from "./useDriverSettingsController.js";

const { Title, Text } = Typography;

export default function DriverSettingsPage({ forceTab = null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    loading,
    savingServices,
    vehicleModalOpen,
    vehicleModalMode,
    vehicleModalLoading,
    editingVehicle,
    application,
    serviceTypes,
    setServiceTypes,
    vehicles,
    vehicleRequests,
    activeTab,
    setActiveTab,
    activeVehicle,
    saveServices,
    openAddVehicleModal,
    openEditVehicleModal,
    closeVehicleModal,
    handleVehicleRequestSubmit,
    setActiveVehicle,
    registerSummary,
    registerVehiclePreset,
  } = useDriverSettingsController({ searchParams });

  const tabs = useMemo(
    () => [
      {
        key: "services",
        label: (
          <Space>
            <SettingOutlined />
            Xizmat turlari
          </Space>
        ),
        children: (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Alert
              type="info"
              showIcon
              message="Roʻyxatdan oʻtishda tanlangan xizmatlarni shu yerda boshqarasiz"
              description="Xizmat holati darhol saqlanadi. Mashina turi va sigʻimi boʻyicha soʻrovlar tasdiqlangach yangilanadi."
              style={{ borderRadius: 16 }}
            />
            <ServiceTypesEditor value={serviceTypes} onChange={setServiceTypes} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button type="primary" icon={<SaveOutlined />} onClick={saveServices} loading={savingServices}>
                Xizmatlarni saqlash
              </Button>
            </div>
          </Space>
        ),
      },
      {
        key: "vehicles",
        label: (
          <Space>
            <CarOutlined />
            Mashinalar
          </Space>
        ),
        children: (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Alert
              type="warning"
              showIcon
              message="Mashina maʼlumotlari bo‘yicha yuborilgan so‘rov tasdiqlangach kuchga kiradi"
              description="Yangi mashina qoʻshishingiz yoki o‘zgartirish yuborishingiz mumkin. Buyurtmalar faqat aktiv mashina bo‘yicha chiqadi."
              style={{ borderRadius: 16 }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <Space direction="vertical" size={0}>
                <Text style={{ color: "#f8fafc", fontWeight: 700, fontSize: 16 }}>Aktiv mashina</Text>
                <Text style={{ color: "#94a3b8" }}>
                  Hozirgi buyurtmalar {activeVehicle ? `${registerVehiclePreset(activeVehicle.vehicleType).label} (${activeVehicle.plateNumber || "raqamsiz"})` : "registratsiyadagi mashina"} bo'yicha chiqadi.
                </Text>
              </Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={openAddVehicleModal}>
                Yangi mashina qo'shish
              </Button>
            </div>

            {vehicles.length === 0 ? (
              <Empty
                description="Hali tasdiqlangan qo'shimcha mashina yo'q"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onSetActive={setActiveVehicle}
                  onEditRequest={openEditVehicleModal}
                />
              ))
            )}

            <Card style={CARD_STYLE} bodyStyle={{ padding: 16 }}>
              <Text style={{ color: "#f8fafc", fontWeight: 700, display: "block", marginBottom: 12 }}>
                Registratsiyadagi asosiy mashina
              </Text>
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}><Text style={SECTION_LABEL_STYLE}>Mashina turi:</Text> <Text style={{ color: "#e2e8f0" }}>{registerSummary.label}</Text></Col>
                <Col xs={24} md={12}><Text style={SECTION_LABEL_STYLE}>Marka / model:</Text> <Text style={{ color: "#e2e8f0" }}>{registerSummary.brand} {registerSummary.model}</Text></Col>
                <Col xs={24} md={12}><Text style={SECTION_LABEL_STYLE}>Davlat raqami:</Text> <Text style={{ color: "#e2e8f0" }}>{registerSummary.plate}</Text></Col>
                <Col xs={24} md={12}><Text style={SECTION_LABEL_STYLE}>Holati:</Text> <Tag color={registerSummary.status === "approved" ? "green" : "gold"}>{registerSummary.status}</Tag></Col>
                <Col xs={24} md={12}><Text style={SECTION_LABEL_STYLE}>O'rindiq:</Text> <Text style={{ color: "#e2e8f0" }}>{registerSummary.seats}</Text></Col>
                <Col xs={24} md={12}><Text style={SECTION_LABEL_STYLE}>Sig'im:</Text> <Text style={{ color: "#e2e8f0" }}>{registerSummary.cargoKg} kg / {registerSummary.cargoM3} m³</Text></Col>
              </Row>
            </Card>

            <Card style={CARD_STYLE} bodyStyle={{ padding: 16 }}>
              <Text style={{ color: "#f8fafc", fontWeight: 700, display: "block", marginBottom: 12 }}>
                Mashina so'rovlari tarixi
              </Text>
              {vehicleRequests.length === 0 ? (
                <Text style={{ color: "#94a3b8" }}>Hali so'rov yuborilmagan.</Text>
              ) : (
                vehicleRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(148, 163, 184, 0.12)",
                      padding: 12,
                      marginBottom: 10,
                    }}
                  >
                    <Space wrap>
                      <Tag color="blue">{request.request_type}</Tag>
                      <Tag color={request.status === "approved" ? "green" : request.status === "rejected" ? "red" : "gold"}>
                        {request.status}
                      </Tag>
                    </Space>
                    <div style={{ color: "#cbd5e1", marginTop: 8 }}>
                      {request?.payload?.vehicle_type || "—"} · {request?.payload?.brand || ""} {request?.payload?.model || ""}
                    </div>
                    <div style={{ color: "#94a3b8", marginTop: 4 }}>
                      {request?.payload?.max_weight_kg || 0} kg · {request?.payload?.max_volume_m3 || 0} m³
                    </div>
                  </div>
                ))
              )}
            </Card>
          </Space>
        ),
      },
    ],
    [
      activeVehicle,
      openAddVehicleModal,
      openEditVehicleModal,
      registerSummary,
      saveServices,
      savingServices,
      serviceTypes,
      setActiveVehicle,
      vehicleRequests,
      vehicles,
    ]
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(6,182,212,0.15), transparent 25%), radial-gradient(circle at top right, rgba(59,130,246,0.16), transparent 30%), linear-gradient(180deg, #020617 0%, #0f172a 50%, #111827 100%)",
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <PageBackButton fallback="/driver" />
          <div>
            <Title level={3} style={{ margin: 0, color: "#f8fafc" }}>
              Haydovchi sozlamalari
            </Title>
            <Text style={{ color: "#94a3b8" }}>
              Xizmatlar shu sahifada boshqariladi. Mashina bo‘yicha yuborilgan so‘rov tasdiqlangach aktiv bo‘ladi.
            </Text>
          </div>
        </div>

        <Card style={{ ...CARD_STYLE, marginBottom: 16 }} bodyStyle={{ padding: 20 }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Text style={SECTION_LABEL_STYLE}>Ariza holati:</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color={application?.status === "approved" ? "green" : application?.status === "rejected" ? "red" : "gold"}>
                  {application?.status || "pending"}
                </Tag>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <Text style={SECTION_LABEL_STYLE}>Asosiy mashina:</Text>
              <div style={{ color: "#e2e8f0", marginTop: 8 }}>{registerSummary.label}</div>
            </Col>
            <Col xs={24} md={8}>
              <Text style={SECTION_LABEL_STYLE}>Aktiv mashina:</Text>
              <div style={{ color: "#e2e8f0", marginTop: 8 }}>
                {activeVehicle ? `${registerVehiclePreset(activeVehicle.vehicleType).label} · ${activeVehicle.plateNumber || "raqamsiz"}` : "Hali tanlanmagan"}
              </div>
            </Col>
          </Row>
        </Card>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            const next = new URLSearchParams(searchParams);
            next.set("tab", key);
            setSearchParams(next, { replace: true });
          }}
          items={tabs}
          destroyInactiveTabPane={false}
          style={{ color: "#e2e8f0" }}
        />
      </div>

      <VehicleRequestModal
        open={vehicleModalOpen}
        mode={vehicleModalMode}
        initialValues={editingVehicle}
        onCancel={closeVehicleModal}
        onSubmit={handleVehicleRequestSubmit}
        loading={vehicleModalLoading}
      />
    </div>
  );
}
