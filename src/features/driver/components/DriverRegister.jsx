import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Steps,
  Typography,
  Upload,
  message,
} from "antd";
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
  const name = String(originalName || "file")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^\.+/, "");
  return name.length ? name.slice(0, 120) : `file_${Date.now()}`;
}

function buildStoragePath(userId, file) {
  const safeName = sanitizeFilename(file?.name);
  const rand = Math.random().toString(36).slice(2, 10);
  return `driver_applications/${userId}/${Date.now()}_${rand}_${safeName}`;
}

async function uploadToStorage(userId, file, bucket = "driver-docs") {
  if (!file) return null;
  const filePath = buildStoragePath(userId, file);
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  return filePath;
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
  if (!digits) return null;
  return `${PHONE_PREFIX}${digits}`;
}

function splitPhoneLocal(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("998")) return digits.slice(3, 12);
  return digits.slice(0, 9);
}

function toNullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function DriverRegister() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [bootLoading, setBootLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState({});
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [driverApplication, setDriverApplication] = useState(null);
  const [driverRow, setDriverRow] = useState(null);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const steps = [
    { title: "Shaxsiy ma'lumot" },
    { title: "Transport turi" },
    { title: "Hujjatlar" },
  ];

  const isApprovedDriver = !!(
    driverRow && (driverRow.is_verified === true || driverRow.approved === true)
  );
  const applicationStatus = String(driverApplication?.status || "").toLowerCase();

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        setBootLoading(true);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        const user = session?.user || null;

        if (!active) return;
        setSessionUser(user);

        if (!user?.id) {
          navigate("/login", { replace: true });
          return;
        }

        const [profileRes, appRes, driverRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase
            .from("driver_applications")
            .select("*")
            .eq("user_id", user.id)
            .order("submitted_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle(),
        ]);

        if (profileRes.error) throw profileRes.error;
        if (appRes.error) throw appRes.error;
        if (driverRes.error) throw driverRes.error;

        if (!active) return;

        const profileRow = profileRes.data || null;
        const appRow = appRes.data || null;
        const drvRow = driverRes.data || null;

        setProfile(profileRow);
        setDriverApplication(appRow);
        setDriverRow(drvRow);

        if (drvRow && (drvRow.is_verified === true || drvRow.approved === true)) {
          navigate("/app/driver/dashboard", { replace: true });
          return;
        }

        if (String(appRow?.status || "").toLowerCase() === "pending") {
          navigate("/app/driver/pending", { replace: true });
          return;
        }

        if (String(appRow?.status || "").toLowerCase() === "approved") {
          navigate("/app/driver/dashboard", { replace: true });
          return;
        }

        const fullName = String(profileRow?.full_name || "").trim();
        const parts = fullName ? fullName.split(/\s+/) : [];

        form.setFieldsValue({
          first_name: profileRow?.first_name || parts[0] || "",
          last_name: profileRow?.last_name || parts.slice(1).join(" ") || "",
          phone: splitPhoneLocal(profileRow?.phone || user?.phone || ""),
          transport_type: appRow?.transport_type || "light_car",
          vehicle_brand: appRow?.vehicle_brand || "",
          vehicle_model: appRow?.vehicle_model || "",
          vehicle_year: appRow?.vehicle_year ?? null,
          vehicle_plate: appRow?.vehicle_plate || "",
          vehicle_color: appRow?.vehicle_color || "",
          seat_count: appRow?.seat_count ?? 4,
          requested_max_freight_weight_kg:
            appRow?.requested_max_freight_weight_kg ?? 100,
          requested_payload_volume_m3:
            appRow?.requested_payload_volume_m3 ?? null,
          passport_number: appRow?.passport_number || "",
          driver_license_number: appRow?.driver_license_number || "",
          tech_passport_number: appRow?.tech_passport_number || "",
          father_name: appRow?.father_name || "",
        });
      } catch (error) {
        console.error("DriverRegister bootstrap error:", error);
        message.error(error?.message || "Sahifani yuklashda xatolik yuz berdi");
      } finally {
        if (active) setBootLoading(false);
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [form, navigate]);

  const setFile = (key, file) => {
    setFiles((prev) => ({ ...prev, [key]: file || null }));
  };

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

    if (
      step === 2 &&
      (!files.selfie ||
        !files.passport_front ||
        !files.passport_back ||
        !files.license_front ||
        !files.license_back)
    ) {
      message.error("Majburiy hujjat rasmlarini yuklang");
      return;
    }

    setStep((s) => Math.min(steps.length - 1, s + 1));
  };

  const submit = async (values) => {
    try {
      setSubmitting(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user?.id) throw new Error("Foydalanuvchi topilmadi");

      const phone = normalizePhone(
        values.phone || profile?.phone || sessionUser?.phone
      );
      if (!phone) throw new Error("Telefon raqam noto'g'ri");

      const fullName = `${values.first_name || ""} ${values.last_name || ""}`.trim();

      const profilePayload = {
        id: user.id,
        phone,
        full_name: fullName || null,
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        role: profile?.role || "client",
        current_role: profile?.current_role || "client",
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profilePayload, {
          onConflict: "id",
        });

      if (profileError) throw profileError;

      const payload = {
        user_id: user.id,
        status: "pending",
        transport_type: values.transport_type,
        last_name: values.last_name || null,
        first_name: values.first_name || null,
        father_name: values.father_name || null,
        phone,
        passport_number: values.passport_number || null,
        driver_license_number: values.driver_license_number || null,
        tech_passport_number: values.tech_passport_number || null,
        vehicle_brand: values.vehicle_brand || null,
        vehicle_model: values.vehicle_model || null,
        vehicle_year: toNullableNumber(values.vehicle_year),
        vehicle_plate: values.vehicle_plate || null,
        vehicle_color: values.vehicle_color || null,
        seat_count: toNullableNumber(values.seat_count),
        requested_max_freight_weight_kg: toNullableNumber(
          values.requested_max_freight_weight_kg
        ),
        requested_payload_volume_m3: toNullableNumber(
          values.requested_payload_volume_m3
        ),
        can_luggage: !!values.can_luggage,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

      if (driverApplication?.id) {
        payload.id = driverApplication.id;
      }

      const { error } = await supabase
        .from("driver_applications")
        .upsert(payload, {
          onConflict: driverApplication?.id ? "id" : "user_id",
        });

      if (error) throw error;

      message.success(
        "Ariza yuborildi. Admin tekshiruvdan keyin driver rejimi ochiladi."
      );
      navigate("/app/driver/pending", { replace: true });
    } catch (error) {
      console.error("Driver register error:", error);
      message.error(error?.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  if (bootLoading) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (isApprovedDriver) {
    return (
      <div style={{ maxWidth: 720, margin: "40px auto", padding: 20 }}>
        <Card bordered={false} style={{ borderRadius: 20 }}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Title level={3} style={{ margin: 0 }}>
              Siz allaqachon tasdiqlangansiz
            </Title>
            <Button
              type="primary"
              onClick={() => navigate("/app/driver/dashboard", { replace: true })}
            >
              Driver dashboard ga o'tish
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <Card bordered={false} style={{ borderRadius: 20 }}>
        <Title level={3} style={{ marginTop: 0 }}>
          Haydovchi bo'lish uchun ariza
        </Title>
        <Text type="secondary">
          Bitta foydalanuvchi ID barcha modullar uchun ishlatiladi. Driver rejimi
          faqat admin tasdiqlagandan keyin ochiladi.
        </Text>

        {applicationStatus === "rejected" ? (
          <Alert
            style={{ marginTop: 16, marginBottom: 8 }}
            type="warning"
            showIcon
            message="Arizangiz rad etilgan. Tuzatib qayta yuborishingiz mumkin."
            description={driverApplication?.rejection_reason || undefined}
          />
        ) : null}

        <div style={{ marginTop: 20, marginBottom: 24 }}>
          <Steps current={step} items={steps} />
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          initialValues={{
            transport_type: "light_car",
            seat_count: 4,
            requested_max_freight_weight_kg: 100,
          }}
        >
          {step === 0 ? (
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
                  <Input addonBefore={PHONE_PREFIX} maxLength={9} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="passport_number"
                  label="Pasport seriya raqami"
                  rules={[
                    { required: true, message: "Pasport raqamini kiriting" },
                  ]}
                >
                  <Input placeholder="AA1234567" />
                </Form.Item>
              </Col>
            </Row>
          ) : null}

          {step === 1 ? (
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="transport_type"
                  label="Transport turi"
                  rules={[{ required: true, message: "Transport turini tanlang" }]}
                >
                  <Select options={TRANSPORT_OPTIONS} />
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
                  rules={[
                    { required: true, message: "Davlat raqamini kiriting" },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="vehicle_year" label="Yili">
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1970}
                    max={currentYear + 1}
                  />
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
                <Form.Item
                  name="requested_max_freight_weight_kg"
                  label="Yuk limiti (kg)"
                >
                  <InputNumber style={{ width: "100%" }} min={0} max={50000} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="requested_payload_volume_m3" label="Hajm (m³)">
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    max={200}
                    step={0.1}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Text type="secondary">
                  Engil mashinaga barcha xizmatlar ruxsat qilinadi, lekin freight
                  dispatch faqat belgilangan kg limit ichida ko'rsatiladi.
                </Text>
              </Col>
            </Row>
          ) : null}

          {step === 2 ? (
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
          ) : null}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <Button
              onClick={() =>
                step === 0
                  ? navigate("/app/client/home")
                  : setStep((s) => Math.max(0, s - 1))
              }
            >
              Ortga
            </Button>
            {step < steps.length - 1 ? (
              <Button type="primary" onClick={next}>
                Keyingi
              </Button>
            ) : (
              <Button type="primary" htmlType="submit" loading={submitting}>
                Arizani yuborish
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}
