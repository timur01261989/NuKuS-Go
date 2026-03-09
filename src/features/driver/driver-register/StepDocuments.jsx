import React from "react";
import { Button, Col, Form, Input, Row, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

export const DOCUMENT_STEP_TITLE = "Hujjatlar";
export const DOCUMENT_STEP_FIELDS = ["driver_license_number"];
export const REQUIRED_DOCUMENT_KEYS = [
  "selfie",
  "passport_front",
  "passport_back",
  "license_front",
  "license_back",
];

export function validateDocumentsStep(files) {
  const missing = REQUIRED_DOCUMENT_KEYS.filter((key) => !files?.[key]);
  if (missing.length) {
    message.error("Majburiy hujjat rasmlarini yuklang");
    throw new Error("Majburiy hujjat rasmlarini yuklang");
  }
}

function UploadField({ label, uploaderProps }) {
  return (
    <Form.Item label={label} required>
      <Upload {...uploaderProps}>
        <Button icon={<UploadOutlined />}>Yuklash</Button>
      </Upload>
    </Form.Item>
  );
}

export default function StepDocuments({ uploaderProps }) {
  return (
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Form.Item
          name="driver_license_number"
          label="Haydovchilik guvohnomasi raqami"
          rules={[{ required: true, message: "Prava raqamini kiriting" }]}
        >
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="tech_passport_number" label="Tex pasport raqami">
          <Input />
        </Form.Item>
      </Col>

      <Col xs={24} md={8}>
        <UploadField label="Selfie" uploaderProps={uploaderProps("selfie")} />
      </Col>
      <Col xs={24} md={8}>
        <UploadField
          label="Pasport oldi"
          uploaderProps={uploaderProps("passport_front")}
        />
      </Col>
      <Col xs={24} md={8}>
        <UploadField
          label="Pasport orqasi"
          uploaderProps={uploaderProps("passport_back")}
        />
      </Col>

      <Col xs={24} md={6}>
        <UploadField
          label="Tex pasport oldi"
          uploaderProps={uploaderProps("tech_front")}
        />
      </Col>
      <Col xs={24} md={6}>
        <UploadField
          label="Tex pasport orqasi"
          uploaderProps={uploaderProps("tech_back")}
        />
      </Col>
      <Col xs={24} md={6}>
        <UploadField
          label="Prava oldi"
          uploaderProps={uploaderProps("license_front")}
        />
      </Col>
      <Col xs={24} md={6}>
        <UploadField
          label="Prava orqasi"
          uploaderProps={uploaderProps("license_back")}
        />
      </Col>

      <Col xs={24} md={6}>
        <UploadField
          label="Mashina rasmi 1"
          uploaderProps={uploaderProps("car_1")}
        />
      </Col>
      <Col xs={24} md={6}>
        <UploadField
          label="Mashina rasmi 2"
          uploaderProps={uploaderProps("car_2")}
        />
      </Col>
      <Col xs={24} md={6}>
        <UploadField
          label="Mashina rasmi 3"
          uploaderProps={uploaderProps("car_3")}
        />
      </Col>
      <Col xs={24} md={6}>
        <UploadField
          label="Mashina rasmi 4"
          uploaderProps={uploaderProps("car_4")}
        />
      </Col>
    </Row>
  );
}
