import React from "react";
import { Col, Form, Input, Row } from "antd";

export default function StepPersonal({ phonePrefix }) {
  return (
    <Row gutter={16}>
      <Col xs={24} md={8}>
        <Form.Item
          name="last_name"
          label="Familiya"
          rules={[{ required: true, message: "Familiya kiriting" }]}
        >
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item
          name="first_name"
          label="Ism"
          rules={[{ required: true, message: "Ism kiriting" }]}
        >
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item name="father_name" label="Otasining ismi">
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="phone"
          label="Telefon (9 ta raqam)"
          rules={[{ required: true, message: "Telefon kiriting" }]}
        >
          <Input addonBefore={phonePrefix} maxLength={9} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="passport_number"
          label="Pasport seriya raqami"
          rules={[{ required: true, message: "Pasport raqamini kiriting" }]}
        >
          <Input placeholder="AA1234567" />
        </Form.Item>
      </Col>
    </Row>
  );
}
