/**
 * DriverRegister.jsx - FIXED VERSION (COMPLETE - 609 LINES)
 * 
 * Location: src/features/driver/components/DriverRegister.jsx
 * 
 * ENHANCEMENT (OPTIONAL):
 * Added useAppMode() hook import
 * Added back button to cancel registration
 * Users can switch back to client mode
 * 
 * INSTALLATION:
 * Replace entire: src/features/driver/components/DriverRegister.jsx with this file
 * (Optional but recommended for better UX)
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  Card,
  Typography,
  Row,
  Col,
  Divider,
  Steps,
  InputNumber,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useAppMode } from '@/providers/AppModeProvider';
import { useDriverText } from "../shared/i18n_driverLocalize";

const PHONE_PREFIX = '+998';

function sanitizeFilename(originalName) {
  const name = (originalName || 'file')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/^\.+/, '');

  return name && name.length ? name.slice(0, 120) : `file_${Date.now()}`;
}

function buildStoragePath(userId, file) {
  const safeName = sanitizeFilename(file?.name);
  const rand = Math.random().toString(36).slice(2, 10);
  return `driver_applications/${userId}/${Date.now()}_${rand}_${safeName}`;
}

function normalizeUzPhone(value) {
  const v = (value ?? '').toString();
  const cleaned = v.replace(/[^\d+]/g, '');
  let digits = cleaned.replace(/\D/g, '');
  if (digits.startsWith('998')) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  return PHONE_PREFIX + digits;
}

const { Title, Text } = Typography;

// Validation helpers
const LATIN_NAME_RE = /^[A-Za-z\s'\-]+$/;
const PHONE_RE = /^\+?\d{9,15}$/;
const PASSPORT_RE = /^[A-Za-z]{2}\d{7}$/;

async function uploadToStorage(userId, file, bucket = 'driver-docs') {
  if (!file) return null;
  const filePath = buildStoragePath(userId, file);

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw error;

  return filePath;
}

export default function DriverRegister() {
  const { cp } = useDriverText();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const [selfieFile, setSelfieFile] = useState(null);
  const [passportFrontFile, setPassportFrontFile] = useState(null);
  const [passportBackFile, setPassportBackFile] = useState(null);

  const [techPassFrontFile, setTechPassFrontFile] = useState(null);
  const [techPassBackFile, setTechPassBackFile] = useState(null);

  const [licenseFrontFile, setLicenseFrontFile] = useState(null);
  const [licenseBackFile, setLicenseBackFile] = useState(null);

  const [carPhotoFile1, setCarPhotoFile1] = useState(null);
  const [carPhotoFile2, setCarPhotoFile2] = useState(null);
  const [carPhotoFile3, setCarPhotoFile3] = useState(null);
  const [carPhotoFile4, setCarPhotoFile4] = useState(null);

  const steps = [
    { title: cp("Shaxsiy ma'lumotlar") },
    { title: cp('Mashina') },
    { title: cp('Guvohnoma') },
  ];

  const stepFields = useMemo(
    () => [
      ['last_name', 'first_name', 'father_name', 'phone', 'passport_id'],
      ['car_model', 'car_plate_number', 'car_year', 'car_color'],
      ['prava_number'],
    ],
    []
  );

  const requiredFilesOk = () => {
    if (step === 0) return !!(selfieFile && passportFrontFile && passportBackFile);
    if (step === 1) return !!(techPassFrontFile && techPassBackFile);
    if (step === 2) return !!(licenseFrontFile && licenseBackFile);
    return true;
  };

  const goNext = async () => {
    try {
      await form.validateFields(stepFields[step]);
      if (!requiredFilesOk()) {
        message.error(cp('Majburiy rasmlarni yuklang'));
        return;
      }
      setStep((s) => Math.min(2, s + 1));
    } catch {
      // validation errors shown by antd
    }
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;
      if (!user?.id) throw new Error(cp('User not authenticated'));

      if (!selfieFile || !passportFrontFile || !passportBackFile) {
        throw new Error(cp('Selfi va pasport rasmlari majburiy'));
      }
      if (!techPassFrontFile || !techPassBackFile) {
        throw new Error(cp('Texpasport (oldi/orqasi) majburiy'));
      }
      if (!licenseFrontFile || !licenseBackFile) {
        throw new Error(cp('Guvohnoma (oldi/orqasi) majburiy'));
      }

      // Upload all files
      const selfie_url = await uploadToStorage(user.id, selfieFile);
      const passport_front_url = await uploadToStorage(user.id, passportFrontFile);
      const passport_back_url = await uploadToStorage(user.id, passportBackFile);

      const tech_passport_front_url = await uploadToStorage(user.id, techPassFrontFile);
      const tech_passport_back_url = await uploadToStorage(user.id, techPassBackFile);

      const driver_license_front_url = await uploadToStorage(user.id, licenseFrontFile);
      const driver_license_back_url = await uploadToStorage(user.id, licenseBackFile);

      const car_photo_1 = await uploadToStorage(user.id, carPhotoFile1);
      const car_photo_2 = await uploadToStorage(user.id, carPhotoFile2);
      const car_photo_3 = await uploadToStorage(user.id, carPhotoFile3);
      const car_photo_4 = await uploadToStorage(user.id, carPhotoFile4);

      const payload = {
        user_id: user.id,

        last_name: values.last_name,
        first_name: values.first_name,
        father_name: values.father_name,

        phone: values.phone,
        passport_id: values.passport_id,

        selfie_url,
        passport_front_url,
        passport_back_url,

        car_model: values.car_model,
        car_plate_number: values.car_plate_number,
        car_year: values.car_year,
        car_color: values.car_color,

        tech_passport_front_url,
        tech_passport_back_url,

        prava_number: values.prava_number,
        driver_license_front_url,
        driver_license_back_url,

        car_photo_1,
        car_photo_2,
        car_photo_3,
        car_photo_4,

        status: 'pending',
      };

      const { error: upsertError } = await supabase
        .from('driver_applications')
        .upsert(payload, { onConflict: 'user_id' });
      if (upsertError) throw upsertError;

      // TUZATISH: Drivers jadvaliga ham pending record yaratish
      // Bu RoleGate ning requireDriverApproved tekshiruviga javob beradi
      try {
        const fullName = [values.last_name, values.first_name, values.father_name]
          .filter(Boolean)
          .join(" ")
          .trim();

        const driverPayload = {
          user_id: user.id,
          full_name: fullName || null,
          car_model: values.car_model || null,
          car_number: values.car_plate_number || null,
          // is_online defaults to false in DB; do not set here.
        };

        const { error: driverError } = await supabase
          .from('drivers')
          .upsert(driverPayload, { onConflict: 'user_id' });
        
        if (driverError) {
          console.warn('Could not create drivers record:', driverError);
          // Bu xato kritik emas, ariza yo'llandirilgan, shunchaki warning
        }
      } catch (err) {
        console.warn('Driver record creation warning:', err);
      }

      message.success('Ariza qabul qilindi. Pending sahifasiga yo\'natilmoqda...');

      // Redirect to pending page
    setTimeout(() => {
      navigate('/driver/pending', { replace: true });
    }, 500);

  } catch (err) {
    console.error('Driver register error:', err);
    // Satrni backticks ( ` ) ichiga oldik, shunda o'zbekcha tutuq belgilari xalaqit bermaydi
    message.error(`Ro'yxatdan o'tishda xatolik: ${err?.message || "Noma'lum xato"}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <Card>
        <Title level={3} style={{ marginTop: 0 }}>Haydovchi registratsiyasi</Title>
        <Text type="secondary">
          Iltimos, barcha ma'lumotlarni toliqlashtirib, kerakli hujjatlarning rasmlari yuklang.
        </Text>

        <Divider />

        <Steps current={step} items={steps} style={{ marginBottom: 24 }} />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {step === 0 && (
            <>
              <Divider orientation="left">1) Shaxsiy ma'lumotlar</Divider>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Familya"
                    name="last_name"
                    rules={[
                      { required: true, message: 'Familyani kiriting' },
                      { pattern: LATIN_NAME_RE, message: 'Faqat lotin harflari' },
                    ]}
                  >
                    <Input maxLength={50} placeholder="Aliyev" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Ismi"
                    name="first_name"
                    rules={[
                      { required: true, message: 'Ismini kiriting' },
                      { pattern: LATIN_NAME_RE, message: 'Faqat lotin harflari' },
                    ]}
                  >
                    <Input maxLength={50} placeholder="Akbar" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Otasining ismi"
                    name="father_name"
                    rules={[
                      { required: true, message: 'Otasining ismini kiriting' },
                      { pattern: LATIN_NAME_RE, message: 'Faqat lotin harflari' },
                    ]}
                  >
                    <Input maxLength={50} placeholder="Mirza" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Telefon raqami"
                    name="phone"
                    rules={[{ required: true, message: 'Telefon raqami majburiy' }]}
                  >
                    <Input
                      maxLength={13}
                      placeholder="+998 99 123-45-67"
                      onChange={(e) => {
                        const normalized = normalizeUzPhone(e.target.value);
                        form.setFieldsValue({ phone: normalized });
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Pasport ID (AA1234567)"
                    name="passport_id"
                    rules={[
                      { required: true, message: 'Pasport ID kiriting' },
                      { pattern: PASSPORT_RE, message: 'Format: AA1234567 (2 harf + 7 raqam)' },
                    ]}
                  >
                    <Input
                      maxLength={9}
                      placeholder="AB1234567"
                      onChange={(e) => {
                        const v = (e.target.value || '').toUpperCase();
                        form.setFieldsValue({ passport_id: v });
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">Shaxsiy hujjatlar</Divider>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Selfi rasm" required>
                    <Upload
                      maxCount={1}
                      beforeUpload={(file) => {
                        setSelfieFile(file);
                        return false;
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Selfi yuklash</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Pasport (old tomoni)" required>
                    <Upload
                      maxCount={1}
                      beforeUpload={(file) => {
                        setPassportFrontFile(file);
                        return false;
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Pasport oldi</Button>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Pasport (orqa tomoni)" required>
                    <Upload
                      maxCount={1}
                      beforeUpload={(file) => {
                        setPassportBackFile(file);
                        return false;
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Pasport orqasi</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {step === 1 && (
            <>
              <Divider orientation="left">2) Mashina ma'lumotlari</Divider>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Mashina modeli"
                    name="car_model"
                    rules={[{ required: true, message: 'Modelni kiriting' }]}
                  >
                    <Input maxLength={50} placeholder="Lacetti" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Davlat raqami (8 belgigacha)"
                    name="car_plate_number"
                    rules={[
                      { required: true, message: 'Davlat raqamini kiriting' },
                      { pattern: /^[A-Za-z0-9]{5,8}$/, message: '5-8 belgi, faqat harf/raqam' },
                    ]}
                  >
                    <Input
                      maxLength={8}
                      placeholder="01A123BC"
                      onChange={(e) => {
                        const v = (e.target.value || '').toUpperCase().replace(/\s+/g, '');
                        form.setFieldsValue({ car_plate_number: v });
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Rangi"
                    name="car_color"
                    rules={[
                      { required: true, message: 'Rangini kiriting' },
                      { pattern: LATIN_NAME_RE, message: 'Faqat lotin harflari' },
                    ]}
                  >
                    <Input maxLength={30} placeholder="Oq" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Ishlab chiqarilgan yili"
                    name="car_year"
                    rules={[
                      { required: true, message: 'Yilni kiriting' },
                      {
                        validator: (_, value) =>
                          value && value > currentYear
                            ? Promise.reject(new Error("Yil hozirgi yildan katta bo'lmasin"))
                            : Promise.resolve(),
                      },
                    ]}
                  >
                    <InputNumber min={1950} max={currentYear} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">Texpasport</Divider>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Texpasport (old tomoni)" required>
                    <Upload
                      maxCount={1}
                      beforeUpload={(file) => {
                        setTechPassFrontFile(file);
                        return false;
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Texpasport oldi</Button>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Texpasport (orqa tomoni)" required>
                    <Upload
                      maxCount={1}
                      beforeUpload={(file) => {
                        setTechPassBackFile(file);
                        return false;
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Texpasport orqasi</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {step === 2 && (
            <>
              <Divider orientation="left">3) Guvohnoma</Divider>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Prava raqami"
                    name="prava_number"
                    rules={[{ required: true, message: 'Prava raqamini kiriting' }]}
                  >
                    <Input maxLength={30} placeholder="Prava raqami" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Guvohnoma (old tomoni)" required>
                    <Upload
                      maxCount={1}
                      beforeUpload={(file) => {
                        setLicenseFrontFile(file);
                        return false;
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Guvohnoma oldi</Button>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Guvohnoma (orqa tomoni)" required>
                    <Upload
                      maxCount={1}
                      beforeUpload={(file) => {
                        setLicenseBackFile(file);
                        return false;
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Guvohnoma orqasi</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Divider />

          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Button 
                block 
                disabled={loading}
                onClick={() => {
                  if (step === 0) {
                    // If on first step, go back to client/home
                    setAppMode("client");
                    navigate("/client/home", { replace: true });
                  } else {
                    // Otherwise go to previous step
                    goBack();
                  }
                }}
              >
                {step === 0 ? "Orqaga" : "Orqaga"}
              </Button>
            </Col>

            <Col xs={24} md={8}>
              {step < 2 ? (
                <Button type="primary" block onClick={goNext} disabled={loading}>
                  Keyingi
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  disabled={
                    loading ||
                    !selfieFile ||
                    !passportFrontFile ||
                    !passportBackFile ||
                    !techPassFrontFile ||
                    !techPassBackFile ||
                    !licenseFrontFile ||
                    !licenseBackFile
                  }
                >
                  Arizani yuborish
                </Button>
              )}
            </Col>

            <Col xs={24} md={8}>
              <Button
                block
                disabled={loading}
                onClick={() => {
                  form.resetFields();
                  setSelfieFile(null);
                  setPassportFrontFile(null);
                  setPassportBackFile(null);
                  setTechPassFrontFile(null);
                  setTechPassBackFile(null);
                  setLicenseFrontFile(null);
                  setLicenseBackFile(null);
                  setCarPhotoFile1(null);
                  setCarPhotoFile2(null);
                  setCarPhotoFile3(null);
                  setCarPhotoFile4(null);
                  setStep(0);
                }}
              >
                Tozalash
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
