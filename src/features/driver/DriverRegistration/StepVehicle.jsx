import React from "react";
import { Col, Form, Input, InputNumber, Row, Select, Typography } from "antd";
import { TRANSPORT_OPTIONS } from "./uploadConfig";
import { normalizePlateNumber } from "./helpers";

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

export default function StepVehicle({ currentYear }) {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 4, color: "#f8fafc" }}>
        Transport ma'lumotlari
      </Title>
      <Text style={{ color: "#94a3b8", display: "block", marginBottom: 20 }}>
        Transport ma'lumotlarini to'ldiring. Bu ma'lumotlar haydovchi profili va
        moderatsiya jarayonida ishlatiladi.
      </Text>

      <Row gutter={[16, 8]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="vehicleType"
            label={<span style={labelStyle}>Transport turi</span>}
            rules={[{ required: true, message: "Transport turini tanlang" }]}
          >
            <Select
              options={TRANSPORT_OPTIONS}
              placeholder="Transport turini tanlang"
              size="large"
              style={{ width: "100%" }}
            />
          </Form.Item>
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

        <Col xs={24} md={8}>
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

        <Col xs={24} md={12}>
          <Form.Item
            name="cargoKg"
            label={<span style={labelStyle}>Yuk limiti (kg)</span>}
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

        <Col xs={24} md={12}>
          <Form.Item
            name="cargoM3"
            label={<span style={labelStyle}>Hajm (m³)</span>}
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
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(148, 163, 184, 0.14)",
              background: "rgba(30, 41, 59, 0.42)",
              padding: 14,
            }}
          >
            <Text style={{ color: "#94a3b8" }}>
              Yengil mashinaga barcha xizmatlar ruxsat qilinadi, lekin yuk tashish xizmati faqat belgilangan kg limit ichida ko'rsatiladi.
            </Text>
          </div>
        </Col>
      </Row>
    </div>
  );
}