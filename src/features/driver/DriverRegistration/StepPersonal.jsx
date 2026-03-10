import React from "react";
import { Col, Form, Input, Row, Typography } from "antd";

const { Text } = Typography;
const PHONE_PREFIX = "+998";

const inputStyle = {
  background: "rgba(15, 23, 42, 0.96)",
  borderColor: "rgba(148, 163, 184, 0.24)",
  color: "#e2e8f0",
  borderRadius: 14,
};

const labelStyle = {
  color: "#cbd5e1",
  fontWeight: 600,
};

const sectionTitleStyle = {
  marginBottom: 4,
  color: "#f8fafc",
};

export default function StepPersonal() {
  return (
    <div>
      <Typography.Title level={4} style={sectionTitleStyle}>
        Shaxsiy ma'lumotlar
      </Typography.Title>
      <Text style={{ color: "#94a3b8", display: "block", marginBottom: 20 }}>
        Ariza uchun asosiy ma'lumotlaringizni kiriting. Telefon raqam faqat 9 ta
        raqam ko'rinishida yoziladi.
      </Text>

      <Row gutter={[16, 8]}>
        <Col xs={24} md={8}>
          <Form.Item
            name="lastName"
            label={<span style={labelStyle}>Familiya</span>}
            rules={[{ required: true, message: "Familiya kiriting" }]}
          >
            <Input placeholder="Familiyangiz" style={inputStyle} size="large" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="firstName"
            label={<span style={labelStyle}>Ism</span>}
            rules={[{ required: true, message: "Ism kiriting" }]}
          >
            <Input placeholder="Ismingiz" style={inputStyle} size="large" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="middleName"
            label={<span style={labelStyle}>Otasining ismi</span>}
          >
            <Input placeholder="Ixtiyoriy" style={inputStyle} size="large" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="phone"
            label={<span style={labelStyle}>Telefon (9 ta raqam)</span>}
            rules={[
              { required: true, message: "Telefon kiriting" },
              {
                validator: (_, value) =>
                  !value || String(value).replace(/\D/g, "").length === 9
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("Telefon 9 ta raqam bo'lishi kerak")
                      ),
              },
            ]}
          >
            <Input
              addonBefore={
                <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{PHONE_PREFIX}</span>
              }
              maxLength={9}
              placeholder="901234567"
              style={inputStyle}
              size="large"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="passportNumber"
            label={<span style={labelStyle}>Pasport seriya raqami</span>}
            rules={[{ required: true, message: "Pasport raqamini kiriting" }]}
          >
            <Input
              placeholder="AA1234567"
              style={inputStyle}
              size="large"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}
