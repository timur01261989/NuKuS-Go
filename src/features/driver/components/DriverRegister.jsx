import React, { useState } from 'react';
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
  Select,
  DatePicker,
} from 'antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../supabaseClient';

const { Title, Text } = Typography;
const { Option } = Select;

// Latin letters only (space, apostrophe, dash allowed)
const LATIN_NAME_RE = /^[A-Za-z\s'\-]+$/;
// Simple alphanumeric for IDs (spaces not allowed)
const ID_RE = /^[A-Za-z0-9]+$/;

const DriverRegister = ({ onRegisterSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Upload state
  const [uploading, setUploading] = useState({
    avatar_url: false,
    car_photo_url: false,
    tex_passport_photo_url: false,
    prava_photo_url: false,

    // NEW (additional)
    passport_front_url: false,
    passport_back_url: false,
    license_front_url: false,
    license_back_url: false,
    tex_front_url: false,
    tex_back_url: false,
  });

  const uploadToStorage = async (file, folder) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('drivers').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('drivers').getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleUpload = async (file, field) => {
    setUploading((prev) => ({ ...prev, [field]: true }));

    try {
      const url = await uploadToStorage(file, field);
      form.setFieldsValue({ [field]: url });
      message.success(`${field} yuklandi`);
    } catch (error) {
      message.error(`${field} yuklashda xatolik: ${error.message}`);
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }

    return false; // Prevent automatic upload
  };

  const normalizeDigits = (v) => (v || '').toString().replace(/\D/g, '');

  const insertDriverApplication = async (values) => {
    // The UI should send full driver application to a dedicated table.
    // If that table doesn't exist, we fallback to old behavior (drivers) with minimal fields.

    const applicationPayload = {
      // identity
      first_name: values.first_name?.trim(),
      last_name: values.last_name?.trim(),
      middle_name: values.middle_name?.trim(),
      phone_number: values.phone_number ? `+998${values.phone_number}` : null,

      // NEW numbers
      passport_id: values.passport_id?.trim() || null,
      prava_number: values.prava_number?.trim() || null,

      // car
      car_model: values.car_model?.trim(),
      plate_number: values.plate_number?.trim()?.toUpperCase(),
      car_color: values.car_color,
      car_year: values.car_year,

      // photos (existing)
      avatar_url: values.avatar_url,
      car_photo_url: values.car_photo_url,
      tex_passport_photo_url: values.tex_passport_photo_url,
      prava_photo_url: values.prava_photo_url,

      // photos (NEW)
      passport_front_url: values.passport_front_url || null,
      passport_back_url: values.passport_back_url || null,
      license_front_url: values.license_front_url || null,
      license_back_url: values.license_back_url || null,
      tex_front_url: values.tex_front_url || null,
      tex_back_url: values.tex_back_url || null,

      // status
      status: 'pending',
    };

    // Prefer driver_applications
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) throw new Error('Avtorizatsiya topilmadi. Qayta login qiling.');

      const { error } = await supabase
        .from('driver_applications')
        .upsert(
          {
            user_id: user.id,
            ...applicationPayload,
          },
          { onConflict: 'user_id' }
        );

      if (!error) return;

      // If table doesn't exist -> fallback below
      if (error.code !== '42P01') {
        // If it exists but schema mismatch, show error clearly
        throw error;
      }
    } catch (e) {
      if (e?.code && e.code !== '42P01') throw e;
      // else continue fallback
    }

    // Fallback: old table drivers (only guaranteed columns)
    const { data: authData2 } = await supabase.auth.getUser();
    const user2 = authData2?.user;
    if (!user2) throw new Error('Avtorizatsiya topilmadi. Qayta login qiling.');

    const minimalDriversPayload = {
      user_id: user2.id,
      // keep status concept even if table has it
      status: 'pending',
      avatar_url: values.avatar_url,
      updated_at: new Date().toISOString(),
    };

    const { error: driversErr } = await supabase.from('drivers').upsert(minimalDriversPayload, {
      onConflict: 'user_id',
    });

    if (driversErr) throw driversErr;
  };

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      await insertDriverApplication(values);

      message.success('Arizangiz yuborildi. Admin tasdiqlagandan keyin dashboard ochiladi.');

      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (error) {
      console.error('Register error:', error);
      message.error(`Ro'yxatdan o'tishda xatolik: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const currentYear = dayjs().year();

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '24px' }}>
      <Row justify="center">
        <Col xs={24} sm={22} md={18} lg={14} xl={12}>
          <Card
            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            bodyStyle={{ padding: '32px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                Haydovchi Ro'yxatdan O'tish
              </Title>
              <Text type="secondary">Ma'lumotlarni to'ldiring va hujjat rasmlarini yuklang</Text>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
              <Title level={4}>Shaxsiy Ma'lumotlar</Title>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="last_name"
                    label="Familiya"
                    rules={[
                      { required: true, message: 'Familiya kiritish majburiy' },
                      {
                        validator: (_, v) => {
                          if (!v) return Promise.resolve();
                          const val = v.trim();
                          if (!LATIN_NAME_RE.test(val)) {
                            return Promise.reject(new Error("Faqat lotin harflari (A-Z) ishlating"));
                          }
                          if (val.length > 50) {
                            return Promise.reject(new Error('Familiya juda uzun'));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input placeholder="Familiyangiz" />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="first_name"
                    label="Ism"
                    rules={[
                      { required: true, message: 'Ism kiritish majburiy' },
                      {
                        validator: (_, v) => {
                          if (!v) return Promise.resolve();
                          const val = v.trim();
                          if (!LATIN_NAME_RE.test(val)) {
                            return Promise.reject(new Error("Faqat lotin harflari (A-Z) ishlating"));
                          }
                          if (val.length > 50) {
                            return Promise.reject(new Error('Ism juda uzun'));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input placeholder="Ismingiz" />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="middle_name"
                    label="Otasining ismi"
                    rules={[
                      { required: true, message: "Otasining ismini kiriting" },
                      {
                        validator: (_, v) => {
                          if (!v) return Promise.resolve();
                          const val = v.trim();
                          if (!LATIN_NAME_RE.test(val)) {
                            return Promise.reject(new Error("Faqat lotin harflari (A-Z) ishlating"));
                          }
                          if (val.length > 50) {
                            return Promise.reject(new Error("Otasining ismi juda uzun"));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input placeholder="Otasining ismi" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="phone_number"
                    label="Telefon Raqam"
                    rules={[
                      { required: true, message: 'Telefon raqam kiritish majburiy' },
                      {
                        validator: (_, v) => {
                          const digits = normalizeDigits(v);
                          if (!digits) return Promise.resolve();
                          if (digits.length !== 9) {
                            return Promise.reject(new Error("Telefon raqam 9 ta raqam bo'lishi kerak"));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input
                      addonBefore="+998"
                      placeholder="901234567"
                      maxLength={9}
                      onChange={(e) => {
                        const value = normalizeDigits(e.target.value).slice(0, 9);
                        form.setFieldsValue({ phone_number: value });
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="passport_id"
                    label="Pasport ID / Pasport raqami"
                    rules={[
                      { required: true, message: 'Pasport ID (yoki raqam) kiritish majburiy' },
                      {
                        validator: (_, v) => {
                          if (!v) return Promise.resolve();
                          const val = v.trim();
                          if (!ID_RE.test(val)) {
                            return Promise.reject(new Error('Faqat harf va raqam (bo‘sh joysiz)'));
                          }
                          if (val.length < 5) {
                            return Promise.reject(new Error('Juda qisqa'));
                          }
                          if (val.length > 20) {
                            return Promise.reject(new Error('Juda uzun'));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input
                      placeholder="AA1234567 / 123456789"
                      maxLength={20}
                      onChange={(e) => {
                        const val = (e.target.value || '').replace(/\s/g, '').slice(0, 20);
                        form.setFieldsValue({ passport_id: val });
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="prava_number"
                    label="Haydovchilik guvohnomasi raqami"
                    rules={[
                      { required: true, message: 'Prava raqami kiritish majburiy' },
                      {
                        validator: (_, v) => {
                          if (!v) return Promise.resolve();
                          const val = v.trim();
                          if (!ID_RE.test(val)) {
                            return Promise.reject(new Error('Faqat harf va raqam (bo‘sh joysiz)'));
                          }
                          if (val.length < 5) {
                            return Promise.reject(new Error('Juda qisqa'));
                          }
                          if (val.length > 20) {
                            return Promise.reject(new Error('Juda uzun'));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input
                      placeholder="Prava raqami"
                      maxLength={20}
                      onChange={(e) => {
                        const val = (e.target.value || '').replace(/\s/g, '').slice(0, 20);
                        form.setFieldsValue({ prava_number: val });
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="birth_date"
                    label="Tug'ilgan Sana"
                    rules={[{ required: true, message: "Tug'ilgan sanani tanlang" }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                  </Form.Item>
                </Col>
              </Row>

              <Title level={4} style={{ marginTop: '24px' }}>
                Avtomobil Ma'lumotlari
              </Title>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="car_model"
                    label="Avtomobil Modeli"
                    rules={[{ required: true, message: 'Model kiritish majburiy' }]}
                  >
                    <Input placeholder="Masalan: Lacetti" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="plate_number"
                    label="Davlat Raqami"
                    rules={[
                      { required: true, message: 'Davlat raqami kiritish majburiy' },
                      {
                        validator: (_, v) => {
                          if (!v) return Promise.resolve();
                          const val = v.trim();
                          if (val.length > 8) {
                            return Promise.reject(new Error('Davlat raqami 8 ta belgidan oshmasin'));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input
                      placeholder="Masalan: 01A123BC"
                      maxLength={8}
                      onChange={(e) => {
                        const val = (e.target.value || '').toUpperCase().slice(0, 8);
                        form.setFieldsValue({ plate_number: val });
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="car_color"
                    label="Rangi"
                    rules={[{ required: true, message: 'Rang tanlash majburiy' }]}
                  >
                    <Select placeholder="Rangni tanlang">
                      <Option value="oq">Oq</Option>
                      <Option value="qora">Qora</Option>
                      <Option value="kulrang">Kulrang</Option>
                      <Option value="qizil">Qizil</Option>
                      <Option value="kok">Ko'k</Option>
                      <Option value="yashil">Yashil</Option>
                      <Option value="sariq">Sariq</Option>
                      <Option value="boshqa">Boshqa</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="car_year"
                    label="Ishlab Chiqarilgan Yili"
                    rules={[
                      { required: true, message: 'Yil kiritish majburiy' },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          if (value < 1990) return Promise.reject(new Error('Yil 1990 dan kichik bo\'lmasin'));
                          if (value > currentYear) {
                            return Promise.reject(new Error(`Yil ${currentYear} dan katta bo'lmasin`));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      placeholder="2020"
                      min={1990}
                      max={currentYear}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (!Number.isNaN(value)) {
                          const clamped = Math.min(Math.max(value, 1990), currentYear);
                          form.setFieldsValue({ car_year: clamped });
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Title level={4} style={{ marginTop: '24px' }}>
                Hujjatlar va Rasmlar
              </Title>

              <Row gutter={16}>
                {/* Selfie */}
                <Col span={12}>
                  <Form.Item
                    name="avatar_url"
                    label="Shaxsiy Foto (Selfi)"
                    rules={[{ required: true, message: 'Shaxsiy foto yuklash majburiy' }]}
                  >
                    <Upload
                      beforeUpload={(file) => handleUpload(file, 'avatar_url')}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button icon={uploading.avatar_url ? <LoadingOutlined /> : <UploadOutlined />}>
                        {uploading.avatar_url ? 'Yuklanmoqda...' : 'Selfi Yuklash'}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>

                {/* Car photo */}
                <Col span={12}>
                  <Form.Item
                    name="car_photo_url"
                    label="Mashina Rasmi"
                    rules={[{ required: true, message: 'Mashina rasmini yuklash majburiy' }]}
                  >
                    <Upload
                      beforeUpload={(file) => handleUpload(file, 'car_photo_url')}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button icon={uploading.car_photo_url ? <LoadingOutlined /> : <UploadOutlined />}>
                        {uploading.car_photo_url ? 'Yuklanmoqda...' : 'Mashina Rasmini Yuklash'}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              {/* Passport images (NEW) */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="passport_front_url"
                    label="Pasport Rasmi (Old tomoni)"
                    rules={[{ required: true, message: 'Pasport old tomon rasmini yuklang' }]}
                  >
                    <Upload
                      beforeUpload={(file) => handleUpload(file, 'passport_front_url')}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button
                        icon={uploading.passport_front_url ? <LoadingOutlined /> : <UploadOutlined />}
                      >
                        {uploading.passport_front_url ? 'Yuklanmoqda...' : 'Pasport Oldini Yuklash'}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="passport_back_url"
                    label="Pasport Rasmi (Orqa tomoni)"
                    rules={[{ required: true, message: 'Pasport orqa tomon rasmini yuklang' }]}
                  >
                    <Upload
                      beforeUpload={(file) => handleUpload(file, 'passport_back_url')}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button
                        icon={uploading.passport_back_url ? <LoadingOutlined /> : <UploadOutlined />}
                      >
                        {uploading.passport_back_url ? 'Yuklanmoqda...' : 'Pasport Orqasini Yuklash'}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              {/* Driver license images (NEW) */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="license_front_url"
                    label="Haydovchilik guvohnomasi (Old tomoni)"
                    rules={[{ required: true, message: 'Guvohnoma old tomon rasmini yuklang' }]}
                  >
                    <Upload
                      beforeUpload={(file) => handleUpload(file, 'license_front_url')}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button
                        icon={uploading.license_front_url ? <LoadingOutlined /> : <UploadOutlined />}
                      >
                        {uploading.license_front_url ? 'Yuklanmoqda...' : 'Guvohnoma Oldini Yuklash'}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="license_back_url"
                    label="Haydovchilik guvohnomasi (Orqa tomoni)"
                    rules={[{ required: true, message: 'Guvohnoma orqa tomon rasmini yuklang' }]}
                  >
                    <Upload
                      beforeUpload={(file) => handleUpload(file, 'license_back_url')}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button
                        icon={uploading.license_back_url ? <LoadingOutlined /> : <UploadOutlined />}
                      >
                        {uploading.license_back_url ? 'Yuklanmoqda...' : 'Guvohnoma Orqasini Yuklash'}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              {/* Tech passport images (NEW) */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="tex_front_url"
                    label="Texpasport (Old tomoni)"
                    rules={[{ required: true, message: 'Texpasport old tomon rasmini yuklang' }]}
                  >
                    <Upload
                      beforeUpload={(file) => handleUpload(file, 'tex_front_url')}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button icon={uploading.tex_front_url ? <LoadingOutlined /> : <UploadOutlined />}>
                        {uploading.tex_front_url ? 'Yuklanmoqda...' : 'Texpasport Oldini Yuklash'}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="tex_back_url"
                    label="Texpasport (Orqa tomoni)"
                    rules={[{ required: true, message: 'Texpasport orqa tomon rasmini yuklang' }]}
                  >
                    <Upload
                      beforeUpload={(file) => handleUpload(file, 'tex_back_url')}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button icon={uploading.tex_back_url ? <LoadingOutlined /> : <UploadOutlined />}>
                        {uploading.tex_back_url ? 'Yuklanmoqda...' : 'Texpasport Orqasini Yuklash'}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              {/* Existing single-photo fields kept for backward compatibility */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="tex_passport_photo_url"
                    label="Texnik Pasport (Eskicha 1 ta rasm)"
                    rules={[{ required: false }]}
                  >
                    <Upload
                      beforeUpload={(file) => handleUpload(file, 'tex_passport_photo_url')}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button
                        icon={uploading.tex_passport_photo_url ? <LoadingOutlined /> : <UploadOutlined />}
                      >
                        {uploading.tex_passport_photo_url
                          ? 'Yuklanmoqda...'
                          : 'Texnik Pasport (1 ta) Yuklash'}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="prava_photo_url"
                    label="Prava (Eskicha 1 ta rasm)"
                    rules={[{ required: false }]}
                  >
                    <Upload
                      beforeUpload={(file) => handleUpload(file, 'prava_photo_url')}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button icon={uploading.prava_photo_url ? <LoadingOutlined /> : <UploadOutlined />}>
                        {uploading.prava_photo_url ? 'Yuklanmoqda...' : 'Prava (1 ta) Yuklash'}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginTop: '32px', textAlign: 'center' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{ height: '48px', padding: '0 48px', fontSize: '16px' }}
                >
                  {loading ? "Yuborilmoqda..." : "Arizani Yuborish"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DriverRegister;
