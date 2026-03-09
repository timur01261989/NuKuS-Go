import React from "react";
import { Col, Form, Input, InputNumber, Row, Select, Typography } from "antd";

const { Text } = Typography;

export default function StepVehicle({ currentYear, transportOptions }) {
  return (
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Form.Item
          name="transport_type"
          label="Transport turi"
          rules={[{ required: true, message: "Transport turini tanlang" }]}
        >
          <Select options={transportOptions} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="vehicle_brand"
          label="Mashina markasi"
          rules={[{ required: true, message: "Markani kiriting" }]}
        >
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="vehicle_model"
          label="Model"
          rules={[{ required: true, message: "Modelni kiriting" }]}
        >
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="vehicle_plate"
          label="Davlat raqami"
          rules={[{ required: true, message: "Davlat raqamini kiriting" }]}
        >
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item name="vehicle_year" label="Yili">
          <InputNumber style={{ width: "100%" }} min={1970} max={currentYear + 1} />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item name="vehicle_color" label="Rangi">
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item name="seat_count" label="O'rindiqlar soni">
          <InputNumber style={{ width: "100%" }} min={0} max={60} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="requested_max_freight_weight_kg" label="Yuk limiti (kg)">
          <InputNumber style={{ width: "100%" }} min={0} max={50000} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="requested_payload_volume_m3" label="Hajm (m³)">
          <InputNumber style={{ width: "100%" }} min={0} max={200} step={0.1} />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Text type="secondary">
          Engil mashinaga barcha xizmatlar ruxsat qilinadi, lekin freight dispatch faqat belgilangan kg limit ichida ko'rsatiladi.
        </Text>
      </Col>
    </Row>
  );
}
