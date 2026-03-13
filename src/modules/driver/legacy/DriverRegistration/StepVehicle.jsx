import React, { memo, useEffect, useMemo, useRef } from "react";
import {
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Typography,
} from "antd";
import {
  getDefaultServiceTypes,
  getVehiclePreset,
  SERVICE_AREA_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  TRANSPORT_OPTIONS,
} from "./uploadConfig";
import { normalizePlateNumber } from "./helpers";
import CircleGuideHint from "@/modules/shared/components/guide/CircleGuideHint";
import { vehicleTypeGuide } from "@/guides/driverRegistration/vehicleTypeGuide";
import { serviceTypesGuide } from "@/guides/driverRegistration/serviceTypesGuide";

const { Text, Title } = Typography;

const fieldStyle = {
  background: "rgba(15, 23, 42, 0.96)",
  borderColor: "rgba(148, 163, 184, 0.24)",
  color: "#e2e8f0",
  borderRadius: 14,
};

const labelStyle = {
  color: "#cbd5e1",
  fontWeight: 600,
};

const checkboxLabelStyle = {
  color: "#e2e8f0",
  fontWeight: 500,
};

function applyVehiclePreset(form, vehicleType) {
  const preset = getVehiclePreset(vehicleType);
  form.setFieldsValue({
    seats: preset.seats,
    cargoKg: preset.cargoKg,
    cargoM3: preset.cargoM3,
    serviceTypes: getDefaultServiceTypes(vehicleType),
  });
}

function ServiceTypeGrid() {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(148, 163, 184, 0.16)",
        background: "rgba(15, 23, 42, 0.72)",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Text style={{ color: "#f8fafc", fontWeight: 700, display: "block", marginBottom: 0 }}>
          Xizmat turlari
        </Text>
        <CircleGuideHint guide={serviceTypesGuide} />
      </div>
      <Text style={{ color: "#94a3b8", display: "block", marginBottom: 14 }}>
        Haydovchi qaysi xizmatlarda ishlashini shu yerda belgilang. Keyin buni Sozlamalar sahifasida o'zgartira oladi.
      </Text>

      {SERVICE_AREA_OPTIONS.map((area) => (
        <div
          key={area.key}
          style={{
            borderRadius: 16,
            border: "1px solid rgba(148, 163, 184, 0.12)",
            background: "rgba(30, 41, 59, 0.4)",
            padding: 14,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "#f8fafc", fontWeight: 700, display: "block", marginBottom: 10 }}>
            {area.label}
          </Text>

          <Row gutter={[12, 12]}>
            {SERVICE_TYPE_OPTIONS.map((service) => (
              <Col xs={24} sm={8} key={`${area.key}_${service.key}`}>
                <Form.Item
                  name={["serviceTypes", area.key, service.key]}
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>
                    <span style={checkboxLabelStyle}>{service.label}</span>
                  </Checkbox>
                </Form.Item>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      <Form.Item
        noStyle
        shouldUpdate={(prev, next) => prev.serviceTypes !== next.serviceTypes}
      >
        {({ getFieldValue }) => {
          const serviceTypes = getFieldValue("serviceTypes") || {};
          const enabledCount = SERVICE_AREA_OPTIONS.reduce(
            (acc, area) =>
              acc +
              SERVICE_TYPE_OPTIONS.reduce(
                (inner, service) => inner + (serviceTypes?.[area.key]?.[service.key] ? 1 : 0),
                0
              ),
            0
          );

          return (
            <Text style={{ color: enabledCount > 0 ? "#7dd3fc" : "#fda4af", display: "block" }}>
              Tanlangan xizmatlar soni: {enabledCount}
            </Text>
          );
        }}
      </Form.Item>
    </div>
  );
}

function StepVehicleComponent({ currentYear }) {
  const form = Form.useFormInstance();
  const vehicleType = Form.useWatch("vehicleType", form);
  const lastVehicleTypeRef = useRef("");

  useEffect(() => {
    if (!vehicleType) return;
    if (!lastVehicleTypeRef.current) {
      lastVehicleTypeRef.current = vehicleType;
      return;
    }
    if (lastVehicleTypeRef.current === vehicleType) return;
    applyVehiclePreset(form, vehicleType);
    lastVehicleTypeRef.current = vehicleType;
  }, [form, vehicleType]);

  const presetHint = useMemo(() => {
    const preset = getVehiclePreset(vehicleType || "light_car");
    return `${preset.label}: ${preset.seats} o'rindiq, ${preset.cargoKg} kg, ${preset.cargoM3} m³`;
  }, [vehicleType]);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 4, color: "#f8fafc" }}>
        Transport ma'lumotlari
      </Title>
      <Text style={{ color: "#94a3b8", display: "block", marginBottom: 20 }}>
        Mashina turi, sig'imi va haydovchi ishlaydigan xizmatlarni to'ldiring. Tizim buyurtmalarni aynan shu ma'lumotlar bo'yicha filter qiladi.
      </Text>

      <Row gutter={[16, 8]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="vehicleType"
            label={
              <span style={{ ...labelStyle, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span>Mashina turi</span>
                <CircleGuideHint guide={vehicleTypeGuide} />
              </span>
            }
            rules={[{ required: true, message: "Mashina turini tanlang" }]}
          >
            <Select
              options={TRANSPORT_OPTIONS}
              placeholder="Mashina turini tanlang"
              size="large"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(34, 211, 238, 0.18)",
              background: "rgba(8, 145, 178, 0.12)",
              padding: 14,
              minHeight: 94,
            }}
          >
            <Text style={{ color: "#67e8f9", fontWeight: 700, display: "block", marginBottom: 4 }}>
              Tavsiya etilgan preset
            </Text>
            <Text style={{ color: "#e0f2fe" }}>{presetHint}</Text>
            <Text style={{ color: "#93c5fd", display: "block", marginTop: 6 }}>
              Mashina turi o'zgarsa, o'rindiq, kg, m³ va xizmat turlari avtomatik moslanadi.
            </Text>
          </div>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="brand"
            label={<span style={labelStyle}>Mashina markasi</span>}
            rules={[{ required: true, message: "Markani kiriting" }]}
          >
            <Input placeholder="Chevrolet" style={fieldStyle} size="large" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="model"
            label={<span style={labelStyle}>Model</span>}
            rules={[{ required: true, message: "Modelni kiriting" }]}
          >
            <Input placeholder="Cobalt" style={fieldStyle} size="large" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="plateNumber"
            label={<span style={labelStyle}>Davlat raqami</span>}
            normalize={normalizePlateNumber}
            rules={[{ required: true, message: "Davlat raqamini kiriting" }]}
          >
            <Input placeholder="01A123BC" maxLength={8} style={fieldStyle} size="large" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="year" label={<span style={labelStyle}>Yili</span>}>
            <InputNumber
              style={{ width: "100%", ...fieldStyle }}
              min={1970}
              max={currentYear + 1}
              placeholder="2024"
              size="large"
              controls={false}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item name="color" label={<span style={labelStyle}>Rangi</span>}>
            <Input placeholder="Oq" style={fieldStyle} size="large" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="seats"
            label={<span style={labelStyle}>O'rindiqlar soni</span>}
            rules={[{ required: true, message: "O'rindiqlar sonini kiriting" }]}
          >
            <InputNumber
              style={{ width: "100%", ...fieldStyle }}
              min={1}
              max={60}
              placeholder="4"
              size="large"
              controls={false}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="cargoKg"
            label={<span style={labelStyle}>Yuk sig'imi (kg)</span>}
            rules={[{ required: true, message: "Yuk sig'imini kiriting" }]}
          >
            <InputNumber
              style={{ width: "100%", ...fieldStyle }}
              min={0}
              max={50000}
              placeholder="1500"
              size="large"
              controls={false}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="cargoM3"
            label={<span style={labelStyle}>Yuk hajmi (m³)</span>}
            rules={[{ required: true, message: "Yuk hajmini kiriting" }]}
          >
            <InputNumber
              style={{ width: "100%", ...fieldStyle }}
              min={0}
              max={200}
              step={0.1}
              placeholder="8.5"
              size="large"
              controls={false}
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            shouldUpdate={(prev, next) => prev.serviceTypes !== next.serviceTypes}
            noStyle
          >
            {() => <ServiceTypeGrid />}
          </Form.Item>
        </Col>

        <Col xs={24}>
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(148, 163, 184, 0.14)",
              background: "rgba(30, 41, 59, 0.42)",
              padding: 14,
            }}
          >
            <Text style={{ color: "#94a3b8" }}>
              Yagona ID prinsipi ishlaydi: haydovchi, mashina va xizmat sozlamalari bitta user_id bilan bog'lanadi. Mashina turi va sig'imi keyin admin tasdig'i bilan o'zgartiriladi.
            </Text>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default memo(StepVehicleComponent);
