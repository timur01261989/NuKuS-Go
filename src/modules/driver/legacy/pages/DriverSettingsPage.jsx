import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import PageBackButton from "@/modules/shared/components/PageBackButton";
import { supabase } from "@/services/supabase/supabaseClient";
import { ACTIVE_VEHICLE_STORAGE_KEY } from "@/modules/driver/legacy/core/driverCapabilityService.js";
import {
  getDefaultServiceTypes,
  getVehiclePreset,
  SERVICE_AREA_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  TRANSPORT_OPTIONS,
  toLegacyTransportType,
} from "@/modules/driver/registration/uploadConfig.js";
import CircleGuideHint from "@/modules/shared/components/guide/CircleGuideHint";
import { vehicleTypeGuide } from "@/guides/driverRegistration/vehicleTypeGuide";
import { serviceTypesGuide } from "@/guides/driverRegistration/serviceTypesGuide";

const { Title, Text } = Typography;

const CARD_STYLE = {
  borderRadius: 20,
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "rgba(15, 23, 42, 0.9)",
  color: "#e2e8f0",
};

const SECTION_LABEL_STYLE = { color: "#cbd5e1", fontWeight: 700 };

function normalizeServiceTypes(rawValue, fallbackVehicleType = "light_car") {
  const defaults = getDefaultServiceTypes(fallbackVehicleType);
  if (!rawValue) return defaults;
  if (typeof rawValue === "string") {
    try {
      return normalizeServiceTypes(JSON.parse(rawValue), fallbackVehicleType);
    } catch (_error) {
      return defaults;
    }
  }

  const hasNestedShape = rawValue?.city || rawValue?.intercity || rawValue?.interdistrict;
  if (hasNestedShape) {
    return {
      city: {
        passenger: !!rawValue?.city?.passenger,
        delivery: !!rawValue?.city?.delivery,
        freight: !!rawValue?.city?.freight,
      },
      intercity: {
        passenger: !!rawValue?.intercity?.passenger,
        delivery: !!rawValue?.intercity?.delivery,
        freight: !!rawValue?.intercity?.freight,
      },
      interdistrict: {
        passenger: !!rawValue?.interdistrict?.passenger,
        delivery: !!rawValue?.interdistrict?.delivery,
        freight: !!rawValue?.interdistrict?.freight,
      },
    };
  }

  return {
    city: {
      passenger: !!rawValue?.city_passenger,
      delivery: !!rawValue?.city_delivery,
      freight: !!rawValue?.city_freight,
    },
    intercity: {
      passenger: !!rawValue?.intercity_passenger,
      delivery: !!rawValue?.intercity_delivery,
      freight: !!rawValue?.intercity_freight,
    },
    interdistrict: {
      passenger: !!rawValue?.interdistrict_passenger,
      delivery: !!rawValue?.interdistrict_delivery,
      freight: !!rawValue?.interdistrict_freight,
    },
  };
}

function flattenServiceTypes(serviceTypes) {
  return {
    city_passenger: !!serviceTypes?.city?.passenger,
    city_delivery: !!serviceTypes?.city?.delivery,
    city_freight: !!serviceTypes?.city?.freight,
    intercity_passenger: !!serviceTypes?.intercity?.passenger,
    intercity_delivery: !!serviceTypes?.intercity?.delivery,
    intercity_freight: !!serviceTypes?.intercity?.freight,
    interdistrict_passenger: !!serviceTypes?.interdistrict?.passenger,
    interdistrict_delivery: !!serviceTypes?.interdistrict?.delivery,
    interdistrict_freight: !!serviceTypes?.interdistrict?.freight,
  };
}

function hasEnabledService(serviceTypes = {}) {
  return SERVICE_AREA_OPTIONS.some((area) =>
    SERVICE_TYPE_OPTIONS.some((service) => !!serviceTypes?.[area.key]?.[service.key])
  );
}

function vehicleRowToUi(row) {
  if (!row) return null;

  return {
    id: row.id,
    vehicleType:
      row.vehicle_type ||
      row.requested_vehicle_type ||
      row.body_type ||
      row.transport_type ||
      "light_car",
    brand: row.brand || row.vehicle_brand || row.title || "",
    model: row.model || row.vehicle_model || "",
    plateNumber: row.plate_number || row.plate || row.vehicle_plate || "",
    color: row.color || row.vehicle_color || "",
    seats: row.seat_count ?? row.seats ?? 0,
    cargoKg:
      row.max_weight_kg ??
      row.capacity_kg ??
      row.requested_max_freight_weight_kg ??
      0,
    cargoM3:
      row.max_volume_m3 ??
      row.capacity_m3 ??
      row.requested_payload_volume_m3 ??
      0,
    approvalStatus: row.approval_status || row.status || "approved",
    isActive: !!row.is_active,
    year: row.year || row.vehicle_year || null,
    createdAt: row.created_at || null,
  };
}

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Foydalanuvchi topilmadi");
  return user;
}

async function safeSelectDriverServiceSettings(userId) {
  const result = await supabase
    .from("driver_service_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    const errorText = String(result.error.message || "").toLowerCase();
    if (errorText.includes("does not exist") || errorText.includes("relation")) {
      return { data: null, error: null, missingTable: true };
    }
  }

  return { ...result, missingTable: false };
}

async function safeSelectVehicles(userId) {
  let result = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", userId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    const errorText = String(result.error.message || "").toLowerCase();
    if (!errorText.includes("column") && !errorText.includes("does not exist")) {
      throw result.error;
    }

    result = await supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", userId)
      .order("created_at", { ascending: false });

    if (result.error) throw result.error;
  }

  return result.data || [];
}

async function safeSelectVehicleRequests(userId) {
  const result = await supabase
    .from("vehicle_change_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (result.error) {
    const errorText = String(result.error.message || "").toLowerCase();
    if (errorText.includes("does not exist") || errorText.includes("relation")) {
      return [];
    }
    throw result.error;
  }

  return result.data || [];
}

const VehicleRequestModal = memo(function VehicleRequestModal({
  open,
  mode,
  initialValues,
  onCancel,
  onSubmit,
  loading,
}) {
  const [form] = Form.useForm();
  const vehicleType = Form.useWatch("vehicleType", form);

  useEffect(() => {
    if (!open) return;
    const baseType = initialValues?.vehicleType || "light_car";
    const preset = getVehiclePreset(baseType);
    form.setFieldsValue({
      vehicleType: baseType,
      brand: initialValues?.brand || "",
      model: initialValues?.model || "",
      plateNumber: initialValues?.plateNumber || "",
      color: initialValues?.color || "",
      year: initialValues?.year || null,
      seats: initialValues?.seats ?? preset.seats,
      cargoKg: initialValues?.cargoKg ?? preset.cargoKg,
      cargoM3: initialValues?.cargoM3 ?? preset.cargoM3,
      note: initialValues?.note || "",
    });
  }, [form, initialValues, open]);

  useEffect(() => {
    if (!open || !vehicleType) return;
    const preset = getVehiclePreset(vehicleType);
    form.setFieldsValue({
      seats: form.getFieldValue("seats") || preset.seats,
      cargoKg: form.getFieldValue("cargoKg") || preset.cargoKg,
      cargoM3: form.getFieldValue("cargoM3") || preset.cargoM3,
    });
  }, [form, open, vehicleType]);

  const submit = useCallback(async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  }, [form, onSubmit]);

  return (
    <Modal
      open={open}
      title={mode === "edit" ? "Mashinani o'zgartirish so'rovi" : "Yangi mashina qo'shish"}
      onCancel={onCancel}
      onOk={submit}
      confirmLoading={loading}
      okText={mode === "edit" ? "So'rov yuborish" : "Mashina qo'shish"}
      cancelText="Bekor qilish"
      width={720}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item
              name="vehicleType"
              label={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span>Mashina turi</span>
                  <CircleGuideHint guide={vehicleTypeGuide} />
                </span>
              }
              rules={[{ required: true, message: "Mashina turini tanlang" }]}
            >
              <Select options={TRANSPORT_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="brand" label="Marka" rules={[{ required: true, message: "Marka kerak" }]}>
              <Input placeholder="Chevrolet" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="model" label="Model" rules={[{ required: true, message: "Model kerak" }]}>
              <Input placeholder="Cobalt" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="plateNumber" label="Davlat raqami" rules={[{ required: true, message: "Davlat raqami kerak" }]}>
              <Input placeholder="01A123BC" maxLength={10} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="year" label="Yili">
              <InputNumber style={{ width: "100%" }} min={1970} max={2100} controls={false} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="color" label="Rangi">
              <Input placeholder="Oq" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="seats" label="O'rindiq soni" rules={[{ required: true, message: "O'rindiq soni kerak" }]}>
              <InputNumber style={{ width: "100%" }} min={1} max={60} controls={false} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="cargoKg" label="Yuk sig'imi (kg)" rules={[{ required: true, message: "kg kerak" }]}>
              <InputNumber style={{ width: "100%" }} min={0} max={50000} controls={false} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="cargoM3" label="Yuk hajmi (m³)" rules={[{ required: true, message: "m³ kerak" }]}>
              <InputNumber style={{ width: "100%" }} min={0} max={200} step={0.1} controls={false} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="note" label="Izoh">
              <Input.TextArea rows={3} placeholder="Masalan: yangi mashina, tex pasport yangilandi va hokazo" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
});

const ServiceTypesEditor = memo(function ServiceTypesEditor({ value, onChange }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Text style={{ color: "#f8fafc", fontWeight: 700 }}>Xizmat turlari</Text>
        <CircleGuideHint guide={serviceTypesGuide} />
      </div>
      {SERVICE_AREA_OPTIONS.map((area) => (
        <Card key={area.key} style={{ ...CARD_STYLE, marginBottom: 12 }} bodyStyle={{ padding: 16 }}>
          <Text style={{ color: "#f8fafc", fontWeight: 700, display: "block", marginBottom: 12 }}>
            {area.label}
          </Text>
          <Row gutter={[12, 12]}>
            {SERVICE_TYPE_OPTIONS.map((service) => (
              <Col xs={24} md={8} key={`${area.key}_${service.key}`}>
                <Checkbox
                  checked={!!value?.[area.key]?.[service.key]}
                  onChange={(event) => {
                    const next = normalizeServiceTypes(value);
                    next[area.key][service.key] = event.target.checked;
                    onChange(next);
                  }}
                >
                  <span style={{ color: "#e2e8f0" }}>{service.label}</span>
                </Checkbox>
              </Col>
            ))}
          </Row>
        </Card>
      ))}
    </div>
  );
});

const VehicleCard = memo(function VehicleCard({ vehicle, onSetActive, onEditRequest }) {
  const preset = getVehiclePreset(vehicle.vehicleType || "light_car");
  return (
    <Card style={{ ...CARD_STYLE, marginBottom: 12 }} bodyStyle={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <Space size={8} wrap>
            <Text style={{ color: "#f8fafc", fontWeight: 700, fontSize: 16 }}>
              {preset.label}
            </Text>
            {vehicle.isActive ? <Tag color="cyan">Aktiv</Tag> : null}
            <Tag color={vehicle.approvalStatus === "approved" ? "green" : "gold"}>
              {vehicle.approvalStatus || "pending"}
            </Tag>
          </Space>
          <div style={{ color: "#cbd5e1", marginTop: 8 }}>
            {vehicle.brand} {vehicle.model} · {vehicle.plateNumber || "Raqam kiritilmagan"}
          </div>
          <div style={{ color: "#94a3b8", marginTop: 6 }}>
            {vehicle.seats || 0} o'rindiq · {vehicle.cargoKg || 0} kg · {vehicle.cargoM3 || 0} m³
          </div>
        </div>

        <Space wrap>
          {!vehicle.isActive ? (
            <Button onClick={() => onSetActive(vehicle.id)} icon={<CheckCircleOutlined />}>
              Aktiv qilish
            </Button>
          ) : null}
          <Button onClick={() => onEditRequest(vehicle)} icon={<ToolOutlined />}>
            O'zgartirish so'rovi
          </Button>
        </Space>
      </div>
    </Card>
  );
});

export default function DriverSettingsPage({ forceTab = null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [savingServices, setSavingServices] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleModalMode, setVehicleModalMode] = useState("add");
  const [vehicleModalLoading, setVehicleModalLoading] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [application, setApplication] = useState(null);
  const [serviceTypes, setServiceTypes] = useState(getDefaultServiceTypes("light_car"));
  const [vehicles, setVehicles] = useState([]);
  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "vehicles" ? "vehicles" : "services");

  const activeVehicle = useMemo(
    () => vehicles.find((item) => item.isActive) || vehicles[0] || null,
    [vehicles]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();

      const { data: applicationData, error: applicationError } = await supabase
        .from("driver_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (applicationError) throw applicationError;
      setApplication(applicationData || null);

      const settingsResult = await safeSelectDriverServiceSettings(user.id);
      const vehicleRows = await safeSelectVehicles(user.id);
      const requestRows = await safeSelectVehicleRequests(user.id);

      const vehicleType =
        applicationData?.requested_vehicle_type ||
        applicationData?.transport_type ||
        vehicleRows?.[0]?.vehicle_type ||
        "light_car";

      const nextServiceTypes = normalizeServiceTypes(
        settingsResult?.data || applicationData?.requested_service_types,
        vehicleType
      );

      setServiceTypes(nextServiceTypes);
      setVehicles(vehicleRows.map(vehicleRowToUi));
      setVehicleRequests(requestRows);
    } catch (error) {
      message.error(error?.message || "Sozlamalarni yuklashda xato");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const nextTab = searchParams.get("tab") === "vehicles" ? "vehicles" : "services";
    setActiveTab(nextTab);
  }, [searchParams]);

  const saveServices = useCallback(async () => {
    if (!hasEnabledService(serviceTypes)) {
      message.error("Kamida bitta xizmatni yoqing");
      return;
    }

    setSavingServices(true);
    try {
      const user = await getCurrentUser();
      const now = new Date().toISOString();

      const flatServicePayload = flattenServiceTypes(serviceTypes);
      const servicePayload = {
        user_id: user.id,
        service_types: serviceTypes,
        ...flatServicePayload,
        updated_at: now,
      };

      let upsertSettings = await supabase
        .from("driver_service_settings")
        .upsert(servicePayload, { onConflict: "user_id" });

      if (upsertSettings.error) {
        const errorText = String(upsertSettings.error.message || "").toLowerCase();
        if (errorText.includes("service_types") && (errorText.includes("column") || errorText.includes("schema cache"))) {
          upsertSettings = await supabase
            .from("driver_service_settings")
            .upsert({ user_id: user.id, ...flatServicePayload, updated_at: now }, { onConflict: "user_id" });
        }
        if (upsertSettings.error) {
          const fallbackText = String(upsertSettings.error.message || "").toLowerCase();
          if (!fallbackText.includes("does not exist") && !fallbackText.includes("relation")) {
            throw upsertSettings.error;
          }
        }
      }

      const appUpdate = await supabase
        .from("driver_applications")
        .update({ requested_service_types: serviceTypes, updated_at: now })
        .eq("user_id", user.id);

      if (appUpdate.error) {
        const errorText = String(appUpdate.error.message || "").toLowerCase();
        if (!errorText.includes("does not exist")) {
          throw appUpdate.error;
        }
      }

      message.success("Xizmat turlari saqlandi");
      await loadAll();
    } catch (error) {
      message.error(error?.message || "Xizmat turlarini saqlashda xato");
    } finally {
      setSavingServices(false);
    }
  }, [loadAll, serviceTypes]);

  const openAddVehicleModal = useCallback(() => {
    setVehicleModalMode("add");
    setEditingVehicle(null);
    setVehicleModalOpen(true);
  }, []);

  const openEditVehicleModal = useCallback((vehicle) => {
    setVehicleModalMode("edit");
    setEditingVehicle(vehicle);
    setVehicleModalOpen(true);
  }, []);

  const closeVehicleModal = useCallback(() => {
    setVehicleModalOpen(false);
    setEditingVehicle(null);
  }, []);

  const handleVehicleRequestSubmit = useCallback(
    async (values) => {
      setVehicleModalLoading(true);
      try {
        const user = await getCurrentUser();
        const now = new Date().toISOString();
        const payload = {
          user_id: user.id,
          vehicle_id: editingVehicle?.id || null,
          request_type: vehicleModalMode === "edit" ? "change_vehicle" : "add_vehicle",
          status: "pending",
          payload: {
            vehicle_type: values.vehicleType,
            transport_type: toLegacyTransportType(values.vehicleType),
            brand: values.brand,
            model: values.model,
            plate_number: String(values.plateNumber || "").toUpperCase(),
            color: values.color || null,
            year: values.year || null,
            seat_count: values.seats,
            max_weight_kg: values.cargoKg,
            max_volume_m3: values.cargoM3,
            note: values.note || "",
          },
          updated_at: now,
        };

        const { error } = await supabase.from("vehicle_change_requests").insert({
          ...payload,
          created_at: now,
        });

        if (error) {
          const errorText = String(error.message || "").toLowerCase();
          if (errorText.includes("does not exist") || errorText.includes("relation") || errorText.includes("schema cache")) {
            message.warning("vehicle_change_requests jadvali hali yaratilmagan. SQL migratsiyani run qiling.");
            return;
          }
          throw error;
        }

        message.success(
          vehicleModalMode === "edit"
            ? "Mashina o'zgartirish so'rovi yuborildi"
            : "Yangi mashina qo'shish so'rovi yuborildi"
        );

        closeVehicleModal();
        await loadAll();
      } catch (error) {
        message.error(error?.message || "Mashina so'rovini yuborishda xato");
      } finally {
        setVehicleModalLoading(false);
      }
    },
    [closeVehicleModal, editingVehicle, loadAll, vehicleModalMode]
  );

  const setActiveVehicle = useCallback(
    async (vehicleId) => {
      try {
        const user = await getCurrentUser();
        const matchingRows = await safeSelectVehicles(user.id);
        const currentVehicles = matchingRows.map(vehicleRowToUi);
        const target = currentVehicles.find((item) => item.id === vehicleId);
        if (!target) {
          message.error("Mashina topilmadi");
          return;
        }

        for (const vehicle of currentVehicles) {
          const updatePayload = {
            is_active: vehicle.id === vehicleId,
            updated_at: new Date().toISOString(),
          };

          const updateByUser = await supabase
            .from("vehicles")
            .update(updatePayload)
            .eq("id", vehicle.id)
            .eq("user_id", user.id);

          if (updateByUser.error) {
            const errorText = String(updateByUser.error.message || "").toLowerCase();
            if (!errorText.includes("column") && !errorText.includes("does not exist")) {
              throw updateByUser.error;
            }

            const updateByDriver = await supabase
              .from("vehicles")
              .update(updatePayload)
              .eq("id", vehicle.id)
              .eq("driver_id", user.id);

            if (updateByDriver.error) throw updateByDriver.error;
          }
        }

        try {
          localStorage.setItem(ACTIVE_VEHICLE_STORAGE_KEY, vehicleId);
        } catch {
          // ignore
        }

        const profileUpdate = await supabase
          .from("profiles")
          .update({ active_vehicle_id: vehicleId })
          .eq("id", user.id);

        if (profileUpdate.error) {
          const errorText = String(profileUpdate.error.message || "").toLowerCase();
          if (!errorText.includes("column") && !errorText.includes("does not exist")) {
            throw profileUpdate.error;
          }
        }

        message.success("Aktiv mashina yangilandi");
        await loadAll();
      } catch (error) {
        message.error(error?.message || "Aktiv mashinani tanlashda xato");
      }
    },
    [loadAll]
  );

  const registerSummary = useMemo(() => {
    const vehicleType = application?.requested_vehicle_type || application?.transport_type || "light_car";
    const preset = getVehiclePreset(vehicleType);
    return {
      label: preset.label,
      brand: application?.vehicle_brand || "—",
      model: application?.vehicle_model || "—",
      plate: application?.vehicle_plate || "—",
      seats: application?.seat_count ?? 0,
      cargoKg: application?.requested_max_freight_weight_kg ?? 0,
      cargoM3: application?.requested_payload_volume_m3 ?? 0,
      status: application?.status || "pending",
    };
  }, [application]);

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
                  Hozirgi buyurtmalar {activeVehicle ? `${getVehiclePreset(activeVehicle.vehicleType).label} (${activeVehicle.plateNumber || "raqamsiz"})` : "registratsiyadagi mashina"} bo'yicha chiqadi.
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
                {activeVehicle ? `${getVehiclePreset(activeVehicle.vehicleType).label} · ${activeVehicle.plateNumber || "raqamsiz"}` : "Hali tanlanmagan"}
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
