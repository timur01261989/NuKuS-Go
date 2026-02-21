import React, { useMemo, useState } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Upload,
  message,
  Typography,
  Steps,
  Row,
  Col,
} from "antd";
import {
  CarOutlined,
  NumberOutlined,
  UserOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CameraOutlined,
  IdcardOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
// Use the same module ID as the rest of the app to avoid accidental duplicate Supabase clients.
import { supabase } from "@lib/supabase";

const { Title, Text } = Typography;
const { Option } = Select;

export default function DriverRegister({ onRegisterSuccess }) {
  // Prevent white-screen crashes when Supabase env is missing/misconfigured.
  // (RoleGate already guards this for most routes, but keep this component safe when used elsewhere.)
  if (!supabase) {
    return (
      <div style={{ padding: 16 }}>
        Supabase konfiguratsiya topilmadi: <code>VITE_SUPABASE_URL</code> va <code>VITE_SUPABASE_ANON_KEY</code> ni tekshiring.
      </div>
    );
  }

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  // Fayllar uchun alohida statelar (preview va UI uchun)
  const [driverPhoto, setDriverPhoto] = useState(null);
  const [carPhoto, setCarPhoto] = useState(null);
  const [pravaPhoto, setPravaPhoto] = useState(null);
  const [texPassportPhoto, setTexPassportPhoto] = useState(null);

  // ✅ Qaysi fieldlar qaysi stepga tegishli
  const stepFields = useMemo(() => {
    return [
      ["first_name", "last_name", "middle_name", "phone", "driver_photo"],
      ["car_model", "plate_number", "car_color", "car_year"],
      ["car_photo", "tex_passport_photo", "prava_photo"],
    ];
  }, []);

  // ✅ Upload props: faylni state + form ichiga yozib, REQUIRED validation ishlatamiz
  const uploadProps = (fieldName, setFile) => ({
    beforeUpload: (file) => {
      setFile(file);
      form.setFieldsValue({ [fieldName]: file });
      // shu field bo‘yicha validationni darrov tekshir
      form.validateFields([fieldName]).catch(() => {});
      return false; // avtomatik upload bo‘lmasin (biz qo‘lda upload qilamiz)
    },
    onRemove: () => {
      setFile(null);
      form.setFieldsValue({ [fieldName]: null });
      form.validateFields([fieldName]).catch(() => {});
    },
    maxCount: 1,
    listType: "picture-card",
    showUploadList: { showPreviewIcon: false },
  });

  // Kichik yordamchi upload tugmasi
  const UploadButton = ({ text, icon }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--card-text)",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ marginTop: 2, fontSize: 12 }}>{text}</div>
    </div>
  );

  // ✅ Step o‘tishda: shu step fieldlarini validate qilib keyin o‘tkazamiz
  const goNext = async () => {
    try {
      await form.validateFields(stepFields[currentStep]);
      setCurrentStep((s) => Math.min(s + 1, 2));
    } catch (e) {
      message.error("Iltimos, barcha majburiy maydonlarni to‘ldiring.");
    }
  };

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  // ✅ Faylni Supabase Storage’ga yuklash helperi
  // Eslatma: bucket nomi "drivers" deb yozilgan. Sizda boshqacha bo‘lsa shu yerni o‘zgartirasiz.
  const uploadToStorage = async ({ bucket, userId, folder, file }) => {
    if (!file) return null;

    const safeName = String(file.name || "file")
      .replace(/\s+/g, "_")
      .replace(/[^\w.\-]/g, "");

    const path = `${userId}/${folder}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      throw new Error(`Storage upload xato: ${uploadError.message}`);
    }

    // Public bucket bo‘lsa ishlaydi, private bo‘lsa ham URL qaytaradi lekin ochilmasligi mumkin.
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data?.publicUrl || null;

    return publicUrl || path; // public bo‘lmasa hech bo‘lmasa path saqlanadi
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      // 1) Userni aniqlash
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      if (!user) {
        message.error("Tizimga kirilmagan!");
        setLoading(false);
        return;
      }

      // 2) Fayllarni Storage’ga yuklash (REAL upload)
      // Bucket: "drivers" (o‘zingizdagi bucket nomiga moslang)
      const bucket = "drivers";

      const avatarUrl = await uploadToStorage({
        bucket,
        userId: user.id,
        folder: "avatar",
        file: values.driver_photo,
      });

      const carUrl = await uploadToStorage({
        bucket,
        userId: user.id,
        folder: "car",
        file: values.car_photo,
      });

      const texUrl = await uploadToStorage({
        bucket,
        userId: user.id,
        folder: "tex-passport",
        file: values.tex_passport_photo,
      });

      const pravaUrl = await uploadToStorage({
        bucket,
        userId: user.id,
        folder: "prava",
        file: values.prava_photo,
      });

      // 3) Telefonni normalize (+998)
      const phoneOnlyDigits = String(values.phone || "").replace(/\D/g, "");
      const phoneFull = `+998${phoneOnlyDigits}`;

      // 4) Bazaga yozish
      const payload = {
        user_id: user.id,

        first_name: values.first_name,
        last_name: values.last_name,
        middle_name: values.middle_name || null,
        phone: phoneFull,

        car_model: values.car_model,
        car_color: values.car_color,
        plate_number: String(values.plate_number || "").toUpperCase().trim(),
        car_year: Number(values.car_year),

        avatar_url: avatarUrl,
        car_photo_url: carUrl,
        tex_passport_url: texUrl,
        prava_url: pravaUrl,

        // `drivers` jadvalida `status` ustuni yo'q. Pending holatini `approved=false` bilan ifodalaymiz.
        approved: false,
      };

      const { error } = await supabase.from("drivers").insert([payload]);
      if (error) throw error;

      // ✅ Ensure profile role becomes "driver" (prevents redirect back to client)
      try {
        await supabase
          .from("profiles")
          .upsert({ id: user.id, role: "driver", phone: phoneFull, updated_at: new Date().toISOString() }, { onConflict: "id" });
      } catch (e) {
        // ignore (RLS might block), RoleGate/RootRedirect still uses drivers table as source of truth
      }

      message.success("Arizangiz qabul qilindi!");
      if (onRegisterSuccess) onRegisterSuccess();

      // optional: form reset
      form.resetFields();
      setDriverPhoto(null);
      setCarPhoto(null);
      setTexPassportPhoto(null);
      setPravaPhoto(null);
      setCurrentStep(0);
    } catch (err) {
      console.error(err);
      message.error("Xatolik: " + (err?.message || "Noma'lum xato"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "0 20px 40px",
        background: "var(--bg-layout)",
        minHeight: "100vh",
        color: "var(--text)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div
          style={{
            background: "rgba(255, 215, 0, 0.18)",
            border: "1px solid rgba(255, 215, 0, 0.25)",
            width: 70,
            height: 70,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 15px",
          }}
        >
          <CarOutlined style={{ fontSize: 35, color: "var(--brand)" }} />
        </div>
        <Title level={3} style={{ margin: 0, color: "var(--text)" }}>
          Haydovchi bo&apos;ling
        </Title>
        <Text type="secondary">
          Ma&apos;lumotlarni to&apos;ldiring va daromad qilishni boshlang
        </Text>
      </div>

      <Steps
        current={currentStep}
        size="small"
        style={{ marginBottom: 30 }}
        items={[{ title: "Shaxsiy" }, { title: "Mashina" }, { title: "Hujjatlar" }]}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleRegister}
        initialValues={{ car_year: "2023" }}
      >
        {/* ====== 1-QADAM: SHAXSIY ====== */}
        <div style={{ display: currentStep === 0 ? "block" : "none" }}>
          <Form.Item
            name="first_name"
            label="Ismingiz"
            rules={[{ required: true, message: "Ismingizni kiriting" }]}
          >
            <Input prefix={<UserOutlined />} size="large" placeholder="Masalan: Timur" />
          </Form.Item>

          <Form.Item
            name="last_name"
            label="Familiyangiz"
            rules={[{ required: true, message: "Familiyangizni kiriting" }]}
          >
            <Input
              prefix={<UserOutlined />}
              size="large"
              placeholder="Masalan: Xalmuratov"
            />
          </Form.Item>

          <Form.Item name="middle_name" label="Otasining ismi">
            <Input
              prefix={<UserOutlined />}
              size="large"
              placeholder="Masalan: Azatovich"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Telefon raqam"
            rules={[
              { required: true, message: "Telefon raqamni kiriting" },
              {
                validator: (_, value) => {
                  const v = String(value || "").replace(/\D/g, "");
                  if (!v) return Promise.reject(new Error("Telefon raqamni kiriting"));
                  if (v.length !== 9)
                    return Promise.reject(
                      new Error("9 xonali raqam kiriting (masalan: 901234567)")
                    );
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              addonBefore="+998"
              size="large"
              placeholder="90 123 45 67"
              inputMode="numeric"
              onChange={(e) => {
                // faqat raqam
                const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                form.setFieldsValue({ phone: digits });
              }}
            />
          </Form.Item>

          {/* Hidden form field: REQUIRED upload validation uchun */}
          <Form.Item
            name="driver_photo"
            rules={[{ required: true, message: "Selfi rasmingizni yuklang" }]}
            style={{ display: "none" }}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Shaxsiy rasmingiz (Selfi)" required>
            <div
              style={{
                textAlign: "center",
                border: "1px dashed var(--field-border)",
                padding: 10,
                borderRadius: 10,
                background: "var(--field-bg)",
              }}
            >
              <Upload {...uploadProps("driver_photo", setDriverPhoto)}>
                {!driverPhoto && <UploadButton text="Rasm yuklash" icon={<CameraOutlined />} />}
              </Upload>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Yuzingiz aniq ko&apos;ringan bo&apos;lishi shart
              </Text>
            </div>
          </Form.Item>

          <Button type="primary" block size="large" onClick={goNext} style={{ marginTop: 10 }}>
            Keyingi qadam
          </Button>
        </div>

        {/* ====== 2-QADAM: MASHINA ====== */}
        <div style={{ display: currentStep === 1 ? "block" : "none" }}>
          <Form.Item name="car_model" label="Mashina modeli" rules={[{ required: true }]}>
            <Select size="large" placeholder="Tanlang">
              <Option value="Gentra">Chevrolet Gentra</Option>
              <Option value="Cobalt">Chevrolet Cobalt</Option>
              <Option value="Nexia3">Nexia 3</Option>
              <Option value="Spark">Spark</Option>
              <Option value="Onix">Onix</Option>
              <Option value="Monza">Monza</Option>
              <Option value="Damas">Damas</Option>
              <Option value="Boshqa">Boshqa</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="plate_number"
            label="Davlat raqami"
            rules={[
              { required: true, message: "Davlat raqamini kiriting" },
              {
                validator: (_, value) => {
                  const v = String(value || "").trim();
                  if (!v) return Promise.reject(new Error("Davlat raqamini kiriting"));
                  if (v.length < 6) return Promise.reject(new Error("Davlat raqami juda qisqa"));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              prefix={<NumberOutlined />}
              size="large"
              placeholder="95 A 777 AA"
              style={{ textTransform: "uppercase" }}
              onChange={(e) => {
                const up = String(e.target.value || "").toUpperCase();
                form.setFieldsValue({ plate_number: up });
              }}
            />
          </Form.Item>

          <Row gutter={10}>
            <Col span={12}>
              <Form.Item
                name="car_color"
                label="Rangi"
                rules={[{ required: true, message: "Rangini kiriting" }]}
              >
                <Input placeholder="Oq" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="car_year"
                label="Yili"
                rules={[
                  { required: true, message: "Yilini kiriting" },
                  {
                    validator: (_, value) => {
                      const y = Number(value);
                      const now = new Date().getFullYear();
                      if (!y) return Promise.reject(new Error("Yilini kiriting"));
                      if (y < 1980 || y > now + 1)
                        return Promise.reject(new Error(`Yil 1980 - ${now + 1} oralig‘ida bo‘lsin`));
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  inputMode="numeric"
                  size="large"
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                    form.setFieldsValue({ car_year: digits });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: "flex", gap: 10 }}>
            <Button block size="large" onClick={goBack}>
              Ortga
            </Button>
            <Button type="primary" block size="large" onClick={goNext}>
              Keyingi
            </Button>
          </div>
        </div>

        {/* ====== 3-QADAM: HUJJATLAR ====== */}
        <div style={{ display: currentStep === 2 ? "block" : "none" }}>
          <Title level={5} style={{ color: "var(--text)" }}>
            Hujjatlarni yuklash
          </Title>

          {/* Hidden fields: REQUIRED upload validation */}
          <Form.Item
            name="car_photo"
            rules={[{ required: true, message: "Mashina rasmini yuklang" }]}
            style={{ display: "none" }}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="tex_passport_photo"
            rules={[{ required: true, message: "Tex pasport rasmini yuklang" }]}
            style={{ display: "none" }}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="prava_photo"
            rules={[{ required: true, message: "Prava rasmini yuklang" }]}
            style={{ display: "none" }}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Mashina rasmi (Oldidan)" required>
            <Upload {...uploadProps("car_photo", setCarPhoto)} style={{ width: "100%" }}>
              {!carPhoto && <UploadButton text="Mashina rasmi" icon={<CarOutlined />} />}
            </Upload>
          </Form.Item>

          <Form.Item label="Texnik pasport (Oldi va orqasi)" required>
            <Upload {...uploadProps("tex_passport_photo", setTexPassportPhoto)}>
              {!texPassportPhoto && (
                <UploadButton text="Texpasport" icon={<FileTextOutlined />} />
              )}
            </Upload>
          </Form.Item>

          <Form.Item label="Haydovchilik guvohnomasi (Prava)" required>
            <Upload {...uploadProps("prava_photo", setPravaPhoto)}>
              {!pravaPhoto && <UploadButton text="Prava" icon={<IdcardOutlined />} />}
            </Upload>
          </Form.Item>

          <div style={{ marginTop: 30, display: "flex", gap: 10 }}>
            <Button block size="large" onClick={goBack}>
              Ortga
            </Button>
            <Button
              type="primary"
              block
              size="large"
              htmlType="submit"
              loading={loading}
              icon={<CheckCircleOutlined />}
              style={{ background: "#52c41a", borderColor: "#52c41a", fontWeight: "bold" }}
            >
              Arizani Yuborish
            </Button>
          </div>

          <div style={{ marginTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Eslatma: Fayllar Supabase Storage&apos;ga yuklanadi. Bucket nomi sizda boshqacha
              bo&apos;lsa, kodda <b>bucket = &quot;drivers&quot;</b> joyini o&apos;zgartiring.
            </Text>
          </div>
        </div>
      </Form>
    </div>
  );
}
