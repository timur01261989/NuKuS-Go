import React from "react";
import { Col, Form, Input, Row } from "antd";

const PHONE_PREFIX = "+998";

export default function StepPersonal() {
  return (
    <Row gutter={16}>
      <Col xs={24} md={8}><Form.Item name="lastName" label="Familiya" rules={[{ required: true, message: "Familiya kiriting" }]}><Input /></Form.Item></Col>
      <Col xs={24} md={8}><Form.Item name="firstName" label="Ism" rules={[{ required: true, message: "Ism kiriting" }]}><Input /></Form.Item></Col>
      <Col xs={24} md={8}><Form.Item name="middleName" label="Otasining ismi"><Input /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="phone" label="Telefon (9 ta raqam)" rules={[{ required: true, message: "Telefon kiriting" },{ validator: (_, value) => !value || String(value).replace(/\D/g, "").length === 9 ? Promise.resolve() : Promise.reject(new Error("Telefon 9 ta raqam bo'lishi kerak")),},]}><Input addonBefore={PHONE_PREFIX} maxLength={9} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="passportNumber" label="Pasport seriya raqami" rules={[{ required: true, message: "Pasport raqamini kiriting" }]}><Input placeholder="AA1234567" /></Form.Item></Col>
    </Row>
  );
}
