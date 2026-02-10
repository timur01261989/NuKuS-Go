import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography, Card, message, ConfigProvider } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined, PhoneOutlined, ArrowLeftOutlined, LockOutlined, CheckCircleOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { supabase } from "../lib/supabase";

const { Title, Text } = Typography;

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState(null); 
  const [form] = Form.useForm();

  // --- 1. AVTOMATIK SMS O‘QISH (WebOTP API) ---
  useEffect(() => {
    if ('OTPCredential' in window && step === 2) {
      const ac = new AbortController();
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: ac.signal
      }).then(otp => {
        form.setFieldsValue({ otp: otp.code });
        onVerifyOtp({ otp: otp.code });
      }).catch(err => console.log("SMS o'qish rad etildi"));
      return () => ac.abort();
    }
  }, [step]);

  // 1-QADAM: SMS YUBORISH
  const onGetOtp = async (values) => {
    setLoading(true);
    try {
      let formattedPhone = values.phone.replace(/\D/g, ''); 
      if (!formattedPhone.startsWith("998")) formattedPhone = "998" + formattedPhone;
      formattedPhone = "+" + formattedPhone;

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;
      message.success("SMS kod yuborildi!");
      setFormData({ ...values, fullPhone: formattedPhone });
      setStep(2);
    } catch (err) {
      message.error("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2-QADAM: KODNI TASDIQLASH (Professional mantiq qo'shildi)
  const onVerifyOtp = async (values) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formData.fullPhone,
        token: values.otp,
        type: 'sms',
      });

      if (error) throw error;

      if (data.user) {
        // --- TIMESTAMP VA DURATION (Aniq vaqtni yozish) ---
        const registrationTime = new Date().toISOString(); 

        await supabase.auth.updateUser({ password: formData.password });

        // --- FIELD_MASK VA WRAPPERS (Faqat kerakli va xavfsiz yozish) ---
        // Foydalanuvchi ism-familiyasi bo'sh bo'lsa, 'Noma'lum' deb yozish (Wrappers mantiqi)
        const safeName = formData.name || "Noma'lum";
        const safeSurname = formData.surname || "Foydalanuvchi";

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert([
                { 
                    id: data.user.id, 
                    full_name: `${safeName} ${safeSurname}`,
                    phone: formData.fullPhone,
                    role: 'client',
                    created_at: registrationTime, // Aniq vaqt
                    last_login: registrationTime
                }
            ]);

        if (profileError) throw profileError;

        message.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
        navigate("/dashboard");
      }
    } catch (err) {
      message.error("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider 
      theme={{ 
        token: { 
          colorPrimary: '#FFD700',
          borderRadius: 16,
          fontFamily: 'YangoHeadline, -apple-system, sans-serif' 
        } 
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f0f2f5", padding: 20 }}>
        <Card style={{ width: 400, borderRadius: 28, boxShadow: "0 15px 35px rgba(0,0,0,0.08)", border: 'none' }}>

          {/* HEADER QISMI (Yango uslubida) */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 25 }}>
             <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} type="text" shape="circle" />
             <Title level={4} className="yango-title" style={{ margin: '0 0 0 10px' }}>Ro'yxatdan o'tish</Title>
          </div>

          {step === 1 ? (
            <Form form={form} layout="vertical" onFinish={onGetOtp} size="large">
                <Form.Item name="name" rules={[{ required: true, message: 'Ismingiz?' }]}>
                   <Input prefix={<UserOutlined />} placeholder="Ism" />
                </Form.Item>
                <Form.Item name="surname" rules={[{ required: true, message: 'Familiyangiz?' }]}>
                   <Input prefix={<UserOutlined />} placeholder="Familiya" />
                </Form.Item>
                <Form.Item name="phone" rules={[{ required: true, message: 'Telefon?' }]}>
                   <Input prefix={<PhoneOutlined />} addonBefore="+998" placeholder="90 123 45 67" type="number" />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, min: 6 }]}>
                   <Input.Password prefix={<LockOutlined />} placeholder="Yangi parol" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 55, borderRadius: 18, fontWeight: "800", background: '#000' }}>
                   SMS KOD OLISH
                </Button>
            </Form>
          ) : (
             <Form form={form} layout="vertical" onFinish={onVerifyOtp} size="large">
                <div style={{ textAlign: 'center', marginBottom: 20, background: '#fffbe6', padding: 15, borderRadius: 12 }}>
                    <Text type="secondary">Kod yuborildi: </Text>
                    <Text strong>{formData?.fullPhone}</Text>
                </div>
                <Form.Item name="otp" rules={[{ required: true, len: 6 }]}>
                    <Input placeholder="· · · · · ·" style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px', fontWeight: 'bold', height: 60 }} maxLength={6} />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 55, borderRadius: 18, fontWeight: "800", background: '#000' }}>
                   TASDIQLASH
                </Button>
             </Form>
          )}
        </Card>
      </div>
      <style>{`.yango-title { font-family: 'YangoHeadline', sans-serif !important; letter-spacing: -1px; }`}</style>
    </ConfigProvider>
  );
}