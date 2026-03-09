import React from "react";
import { Button, Col, Form, Input, Row, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";

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
        <Form.Item label="Selfie" required>
          <Upload {...uploaderProps("selfie")}>
            <Button icon={<UploadOutlined />}>Yuklash</Button>
          </Upload>
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item label="Pasport oldi" required>
          <Upload {...uploaderProps("passport_front")}>
            <Button icon={<UploadOutlined />}>Yuklash</Button>
          </Upload>
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item label="Pasport orqasi" required>
          <Upload {...uploaderProps("passport_back")}>
            <Button icon={<UploadOutlined />}>Yuklash</Button>
          </Upload>
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Form.Item label="Tex pasport oldi">
          <Upload {...uploaderProps("tech_front")}>
            <Button icon={<UploadOutlined />}>Yuklash</Button>
          </Upload>
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Form.Item label="Tex pasport orqasi">
          <Upload {...uploaderProps("tech_back")}>
            <Button icon={<UploadOutlined />}>Yuklash</Button>
          </Upload>
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Form.Item label="Prava oldi" required>
          <Upload {...uploaderProps("license_front")}>
            <Button icon={<UploadOutlined />}>Yuklash</Button>
          </Upload>
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Form.Item label="Prava orqasi" required>
          <Upload {...uploaderProps("license_back")}>
            <Button icon={<UploadOutlined />}>Yuklash</Button>
          </Upload>
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Form.Item label="Mashina rasmi 1">
          <Upload {...uploaderProps("car_1")}>
            <Button icon={<UploadOutlined />}>Yuklash</Button>
          </Upload>
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Form.Item label="Mashina rasmi 2">
          <Upload {...uploaderProps("car_2")}>
            <Button icon={<UploadOutlined />}>Yuklash</Button>
          </Upload>
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Form.Item label="Mashina rasmi 3">
          <Upload {...uploaderProps("car_3")}>
            <Button icon={<UploadOutlined />}>Yuklash</Button>
          </Upload>
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Form.Item label="Mashina rasmi 4">
          <Upload {...uploaderProps("car_4")}>
            <Button icon={<UploadOutlined />}>Yuklash</Button>
          </Upload>
        </Form.Item>
      </Col>
    </Row>
  );
}
