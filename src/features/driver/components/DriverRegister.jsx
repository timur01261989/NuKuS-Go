import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Col, Form, Input, InputNumber, message, Row, Select, Steps, Typography, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

const { Title, Text } = Typography;
const PHONE_PREFIX = "+998";

const TRANSPORT_OPTIONS = [
  { value: "light_car", label: "Engil mashina" },
  { value: "bus_gazel", label: "Avtobus / Gazel" },
  { value: "truck", label: "Yuk tashish mashinasi" },
];

function sanitizeFilename(originalName) {
  const name = (originalName || "file")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^\.+/, "");
  return name && name.length ? name.slice(0, 120) : `file_${Date.now()}`;
}

function buildStoragePath(userId, file) {
  const safeName = sanitizeFilename(file?.name);
  const rand = Math.random().toString(36).slice(2, 10);
  return `driver_applications/${userId}/${Date.now()}_${rand}_${safeName}`;
}

async function uploadToStorage(userId, file, bucket = "driver-docs") {
  if (!file) return null;
  const filePath = buildStoragePath(userId, file);
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: "3600", upsert: true });
  if (error) throw error;
  return filePath;
}

function normalizePhone(v) {
  const digits = String(v || "").replace(/\D/g, "").slice(0, 9);
  return `${PHONE_PREFIX}${digits}`;
}

export default function DriverRegister() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState({});
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const steps = [
    { title: "Shaxsiy ma'lumot" },
    { title: "Transport turi" },
    { title: "Hujjatlar" },
  ];

  const setFile = (key, file) => setFiles((prev) => ({ ...prev, [key]: file }));
  const uploaderProps = (key) => ({
    maxCount: 1,
    beforeUpload: (file) => {
      setFile(key, file);
      return false;
    },
    onRemove: () => setFile(key, null),
    fileList: files[key] ? [files[key]] : [],
  });

  const next = async () => {
    const fieldMap = [
      ["last_name", "first_name", "phone", "passport_number"],
      ["transport_type", "vehicle_brand", "vehicle_model", "vehicle_plate"],
      ["driver_license_number"],
    ];
    await form.validateFields(fieldMap[step]);
    if (step === 2 && (!files.selfie || !files.passport_front || !files.passport_back || !files.license_front || !files.license_back)) {
      message.error("Majburiy hujjat rasmlarini yuklang");
      return;
    }
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };

  const submit = async (values) => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;
      if (!user?.id) throw new Error("Foydalanuvchi topilmadi");

      const payload = {
        user_id: user.id,
        status: "pending",
        transport_type: values.transport_type,
        last_name: values.last_name,
        first_name: values.first_name,
        father_name: values.father_name || null,
        phone: normalizePhone(values.phone),
        passport_number: values.passport_number,
        driver_license_number: values.driver_license_number || null,
        tech_passport_number: values.tech_passport_number || null,
        vehicle_brand: values.vehicle_brand || null,
        vehicle_model: values.vehicle_model || null,
        vehicle_year: values.vehicle_year || null,
        vehicle_plate: values.vehicle_plate || null,
        vehicle_color: values.vehicle_color || null,
        seat_count: values.seat_count || null,
        requested_max_freight_weight_kg: values.requested_max_freight_weight_kg || null,
        requested_payload_volume_m3: values.requested_payload_volume_m3 || null,
        can_luggage: !!values.can_luggage,
      };

      for (const [field, key] of [
        ["selfie_url", "selfie"],
        ["passport_front_url", "passport_front"],
        ["passport_back_url", "passport_back"],
        ["tech_passport_front_url", "tech_front"],
        ["tech_passport_back_url", "tech_back"],
        ["driver_license_front_url", "license_front"],
        ["driver_license_back_url", "license_back"],
        ["car_photo_1", "car_1"],
        ["car_photo_2", "car_2"],
        ["car_photo_3", "car_3"],
        ["car_photo_4", "car_4"],
      ]) {
        payload[field] = await uploadToStorage(user.id, files[key]);
      }

      const { error } = await supabase.from("driver_applications").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;

      message.success("Ariza yuborildi. Admin tekshiruvdan keyin driver rejimi ochiladi.");
      navigate("/driver/pending", { replace: true });
    } catch (error) {
      console.error("Driver register error:", error);
      message.error(error?.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <Card bordered={false} style={{ borderRadius: 20 }}>
        <Title level={3} style={{ marginTop: 0 }}>Haydovchi bo'lish uchun ariza</Title>
        <Text type="secondary">Bitta foydalanuvchi ID barcha modullar uchun ishlatiladi. Driver rejimi faqat admin tasdiqlagandan keyin ochiladi.</Text>
        <div style={{ marginTop: 20, marginBottom: 24 }}><Steps current={step} items={steps} /></div>

        <Form form={form} layout="vertical" onFinish={submit} initialValues={{ transport_type: "light_car", seat_count: 4, requested_max_freight_weight_kg: 100 }}>
          {step === 0 && (
            <Row gutter={16}>
              <Col xs={24} md={8}><Form.Item name="last_name" label="Familiya" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="first_name" label="Ism" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="father_name" label="Otasining ismi"><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="phone" label="Telefon (9 ta raqam)" rules={[{ required: true }]}><Input addonBefore={PHONE_PREFIX} maxLength={9} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="passport_number" label="Pasport seriya raqami" rules={[{ required: true }]}><Input placeholder="AA1234567" /></Form.Item></Col>
            </Row>
          )}

          {step === 1 && (
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="transport_type" label="Transport turi" rules={[{ required: true }]}><Select options={TRANSPORT_OPTIONS} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="vehicle_brand" label="Mashina markasi" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="vehicle_model" label="Model" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="vehicle_plate" label="Davlat raqami" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="vehicle_year" label="Yili"><InputNumber style={{ width: "100%" }} min={1970} max={currentYear + 1} /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="vehicle_color" label="Rangi"><Input /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="seat_count" label="O'rindiqlar soni"><InputNumber style={{ width: "100%" }} min={0} max={60} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="requested_max_freight_weight_kg" label="Yuk limiti (kg)"><InputNumber style={{ width: "100%" }} min={0} max={50000} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="requested_payload_volume_m3" label="Hajm (m³)"><InputNumber style={{ width: "100%" }} min={0} max={200} step={0.1} /></Form.Item></Col>
              <Col xs={24}><Text type="secondary">Engil mashinaga barcha xizmatlar ruxsat qilinadi, lekin freight dispatch faqat belgilangan kg limit ichida ko'rsatiladi.</Text></Col>
            </Row>
          )}

          {step === 2 && (
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="driver_license_number" label="Haydovchilik guvohnomasi raqami" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="tech_passport_number" label="Tex pasport raqami"><Input /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item label="Selfie" required><Upload {...uploaderProps("selfie")}><Button icon={<UploadOutlined />}>Yuklash</Button></Upload></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item label="Pasport oldi" required><Upload {...uploaderProps("passport_front")}><Button icon={<UploadOutlined />}>Yuklash</Button></Upload></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item label="Pasport orqasi" required><Upload {...uploaderProps("passport_back")}><Button icon={<UploadOutlined />}>Yuklash</Button></Upload></Form.Item></Col>
              <Col xs={24} md={6}><Form.Item label="Tex pasport oldi"><Upload {...uploaderProps("tech_front")}><Button icon={<UploadOutlined />}>Yuklash</Button></Upload></Form.Item></Col>
              <Col xs={24} md={6}><Form.Item label="Tex pasport orqasi"><Upload {...uploaderProps("tech_back")}><Button icon={<UploadOutlined />}>Yuklash</Button></Upload></Form.Item></Col>
              <Col xs={24} md={6}><Form.Item label="Prava oldi" required><Upload {...uploaderProps("license_front")}><Button icon={<UploadOutlined />}>Yuklash</Button></Upload></Form.Item></Col>
              <Col xs={24} md={6}><Form.Item label="Prava orqasi" required><Upload {...uploaderProps("license_back")}><Button icon={<UploadOutlined />}>Yuklash</Button></Upload></Form.Item></Col>
              <Col xs={24} md={6}><Form.Item label="Mashina rasmi 1"><Upload {...uploaderProps("car_1")}><Button icon={<UploadOutlined />}>Yuklash</Button></Upload></Form.Item></Col>
              <Col xs={24} md={6}><Form.Item label="Mashina rasmi 2"><Upload {...uploaderProps("car_2")}><Button icon={<UploadOutlined />}>Yuklash</Button></Upload></Form.Item></Col>
              <Col xs={24} md={6}><Form.Item label="Mashina rasmi 3"><Upload {...uploaderProps("car_3")}><Button icon={<UploadOutlined />}>Yuklash</Button></Upload></Form.Item></Col>
              <Col xs={24} md={6}><Form.Item label="Mashina rasmi 4"><Upload {...uploaderProps("car_4")}><Button icon={<UploadOutlined />}>Yuklash</Button></Upload></Form.Item></Col>
            </Row>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <Button onClick={() => step === 0 ? navigate("/client/home") : setStep((s) => Math.max(0, s - 1))}>Ortga</Button>
            {step < steps.length - 1 ? (
              <Button type="primary" onClick={next}>Keyingi</Button>
            ) : (
              <Button type="primary" htmlType="submit" loading={loading}>Arizani yuborish</Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}
