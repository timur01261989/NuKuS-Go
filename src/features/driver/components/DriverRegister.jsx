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

const { Title, Text } = Typography;

// Validation helpers
const LATIN_NAME_RE = /^[A-Za-z\s'\-]+$/;
const PHONE_RE = /^\+?\d{9,15}$/;
const PASSPORT_RE = /^[A-Za-z]{2}\d{7}$/; // AA1234567

async function uploadToStorage(userId, file, bucket = 'driver-docs') {
  if (!file) return null;
  const filePath = `driver_applications/${userId}/${Date.now()}_${file.name}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw error;

  // We store the path (key). Your app can create signed/public URLs later.
  return filePath;
}

export default function DriverRegister() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  // Files
  const [selfieFile, setSelfieFile] = useState(null);
  const [passportFrontFile, setPassportFrontFile] = useState(null);
  const [passportBackFile, setPassportBackFile] = useState(null);

  const [techPassFrontFile, setTechPassFrontFile] = useState(null);
  const [techPassBackFile, setTechPassBackFile] = useState(null);

  const [licenseFrontFile, setLicenseFrontFile] = useState(null);
  const [licenseBackFile, setLicenseBackFile] = useState(null);

  // Optional car photos (table supports them; UI doesn't force)
  const [carPhotoFile1, setCarPhotoFile1] = useState(null);
  const [carPhotoFile2, setCarPhotoFile2] = useState(null);
  const [carPhotoFile3, setCarPhotoFile3] = useState(null);
  const [carPhotoFile4, setCarPhotoFile4] = useState(null);

  const steps = [
    { title: 'Shaxsiy ma’lumotlar' },
    { title: 'Mashina' },
    { title: 'Guvohnoma' },
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
        message.error('Majburiy rasmlarni yuklang');
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
      if (!user?.id) throw new Error('User not authenticated');

      // Final guard
      if (!selfieFile || !passportFrontFile || !passportBackFile) {
        throw new Error('Selfi va pasport rasmlari majburiy');
      }
      if (!techPassFrontFile || !techPassBackFile) {
        throw new Error('Texpasport (oldi/orqasi) majburiy');
      }
      if (!licenseFrontFile || !licenseBackFile) {
        throw new Error('Guvohnoma (oldi/orqasi) majburiy');
      }

      // Uploads
      const selfie_url = await uploadToStorage(user.id, selfieFile);
      const passport_front_url = await uploadToStorage(user.id, passportFrontFile);
      const passport_back_url = await uploadToStorage(user.id, passportBackFile);

      const tech_passport_front_url = await uploadToStorage(user.id, techPassFrontFile);
      const tech_passport_back_url = await uploadToStorage(user.id, techPassBackFile);

      const driver_license_front_url = await uploadToStorage(user.id, licenseFrontFile);
      const driver_license_back_url = await uploadToStorage(user.id, licenseBackFile);

      // Optional
      const car_photo_1 = await uploadToStorage(user.id, carPhotoFile1);
      const car_photo_2 = await uploadToStorage(user.id, carPhotoFile2);
      const car_photo_3 = await uploadToStorage(user.id, carPhotoFile3);
      const car_photo_4 = await uploadToStorage(user.id, carPhotoFile4);

      // IMPORTANT: Use column names that реально bor
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

        // keep existing fields if table expects them
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

      message.success('Ariza qabul qilindi');

      // Redirect to pending page
      navigate('/driver/pending', { replace: true });
    } catch (err) {
      console.error('Driver register error:', err);
      message.error(`Ro‘yxatdan o‘tishda xatolik: ${err?.message || 'Noma’lum xato'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 8 }}>
          Haydovchi ro‘yxatdan o‘tish
        </Title>
        <Text type="secondary">3 ta bosqich: shaxsiy ma’lumotlar → mashina → guvohnoma.</Text>

        <Divider />
        <Steps current={step} items={steps} />
        <Divider />

        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ car_year: currentYear }}>
          {step === 0 && (
            <>
              <Divider orientation="left">1) Shaxsiy ma’lumotlar</Divider>
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
                    <Input maxLength={50} placeholder="Familya" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Ism"
                    name="first_name"
                    rules={[
                      { required: true, message: 'Ismni kiriting' },
                      { pattern: LATIN_NAME_RE, message: 'Faqat lotin harflari' },
                    ]}
                  >
                    <Input maxLength={50} placeholder="Ism" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Sharifi (Otasining ismi)"
                    name="father_name"
                    rules={[
                      { required: true, message: 'Sharifni kiriting' },
                      { pattern: LATIN_NAME_RE, message: 'Faqat lotin harflari' },
                    ]}
                  >
                    <Input maxLength={50} placeholder="Sharif" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Telefon raqami"
                    name="phone"
                    rules={[
                      { required: true, message: 'Telefon raqamini kiriting' },
                      { pattern: PHONE_RE, message: 'Masalan: +998901234567' },
                    ]}
                  >
                    <Input maxLength={15} placeholder="+998901234567" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Pasport raqami"
                    name="passport_id"
                    rules={[
                      { required: true, message: 'Pasport raqamini kiriting' },
                      { pattern: PASSPORT_RE, message: 'Masalan: AA1234567' },
                    ]}
                  >
                    <Input
                      maxLength={9}
                      placeholder="AA1234567"
                      onChange={(e) => {
                        const v = (e.target.value || '').toUpperCase().replace(/\s+/g, '');
                        form.setFieldsValue({ passport_id: v });
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">Rasmlar</Divider>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item label="Selfi" required>
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
                <Col xs={24} md={8}>
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
                <Col xs={24} md={8}>
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
              <Divider orientation="left">2) Mashina ma’lumotlari</Divider>
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

              {/* Optional: keep hidden by default, but still available if you want later */}
              {/*
              <Divider orientation="left">Mashina rasmlari (ixtiyoriy)</Divider>
              <Row gutter={16}>
                <Col xs={24} md={6}><Upload beforeUpload={(f)=>{setCarPhotoFile1(f);return false;}} maxCount={1}><Button icon={<UploadOutlined/>}>1</Button></Upload></Col>
                <Col xs={24} md={6}><Upload beforeUpload={(f)=>{setCarPhotoFile2(f);return false;}} maxCount={1}><Button icon={<UploadOutlined/>}>2</Button></Upload></Col>
                <Col xs={24} md={6}><Upload beforeUpload={(f)=>{setCarPhotoFile3(f);return false;}} maxCount={1}><Button icon={<UploadOutlined/>}>3</Button></Upload></Col>
                <Col xs={24} md={6}><Upload beforeUpload={(f)=>{setCarPhotoFile4(f);return false;}} maxCount={1}><Button icon={<UploadOutlined/>}>4</Button></Upload></Col>
              </Row>
              */}
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
              <Button block disabled={step === 0 || loading} onClick={goBack}>
                Orqaga
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
