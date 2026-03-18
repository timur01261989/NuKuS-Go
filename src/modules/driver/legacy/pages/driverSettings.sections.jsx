import React, { memo, useCallback, useEffect } from "react";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import CircleGuideHint from "@/modules/shared/components/guide/CircleGuideHint";
import { vehicleTypeGuide } from "@/guides/driverRegistration/vehicleTypeGuide";
import { serviceTypesGuide } from "@/guides/driverRegistration/serviceTypesGuide";
import {
  getVehiclePreset,
  SERVICE_AREA_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  TRANSPORT_OPTIONS,
} from "@/modules/driver/registration/uploadConfig.js";
import { CARD_STYLE, normalizeServiceTypes } from "./driverSettings.helpers";

const { Text } = Typography;

export const VehicleRequestModal = memo(function VehicleRequestModal({
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
                  Avtomobil turi
                  <CircleGuideHint guide={vehicleTypeGuide} />
                </span>
              }
              rules={[{ required: true, message: "Transport turini tanlang" }]}
            >
              <Select options={TRANSPORT_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="year" label="Yili">
              <InputNumber style={{ width: "100%" }} min={1990} max={2100} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="brand" label="Markasi" rules={[{ required: true, message: "Markani kiriting" }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="model" label="Model" rules={[{ required: true, message: "Modelni kiriting" }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="plateNumber" label="Davlat raqami">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="color" label="Rangi">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="seats" label="O'rindiqlar soni">
              <InputNumber style={{ width: "100%" }} min={1} max={80} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="cargoKg" label="Yuk sig'imi (kg)">
              <InputNumber style={{ width: "100%" }} min={0} max={50000} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="cargoM3" label="Hajm (m³)">
              <InputNumber style={{ width: "100%" }} min={0} max={200} step={0.1} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="note" label="Izoh">
              <Input.TextArea rows={4} placeholder="Qo'shimcha ma'lumot yoki o'zgartirish sababi" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
});

export const ServiceTypesEditor = memo(function ServiceTypesEditor({ value, onChange }) {
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

export const VehicleCard = memo(function VehicleCard({ vehicle, onSetActive, onEditRequest }) {
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
