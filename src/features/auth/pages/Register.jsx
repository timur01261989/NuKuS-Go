import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography, Card, message, ConfigProvider } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined, PhoneOutlined, ArrowLeftOutlined, LockOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import { requestOtp, verifyOtp } from "@/services/authSupabase"; // YANGI IMPORT (Yo'lni to'g'rilang)

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

  // 1-QADAM: SMS YUBORISH (O'ZGARTIRILDI)
  const onGetOtp = async (values) => {
    setLoading(true);
    try {
      let formattedPhone = values.phone.replace(/\D/g, ''); 
      if (!formattedPhone.startsWith("998")) formattedPhone = "998" + formattedPhone;
      formattedPhone = "+" + formattedPhone;

      // ESKI (Xato berayotgan qism):
      // const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });

      // YANGI (To'g'rilangan qism):
      // Biz endi to'g'ridan-to'g'ri Supabase-ga emas, o'zimizning API-ga murojaat qilamiz
      const response = await requestOtp(formattedPhone);
      
      if (!response.ok) {
         throw new Error("SMS yuborishda xatolik yuz berdi");
      }

      message.success("SMS kod yuborildi!");
      setFormData({ ...values, fullPhone: formattedPhone, session_id: response.session_id });
      setStep(2);
    } catch (err) {
      console.error(err);
      message.error("Xatolik: " + (err.message || "Noma'lum xato"));
    } finally {
      setLoading(false);
    }
  };

  // 2-QADAM: KODNI TASDIQLASH (O'ZGARTIRILDI)
  const onVerifyOtp = async (values) => {
    setLoading(true);
    try {
      // ESKI (Supabase verify):
      // const { data, error } = await supabase.auth.verifyOtp({ ... });

      // YANGI (API verify):
      const verifyResponse = await verifyOtp(formData.fullPhone, values.otp);

      if (!verifyResponse.ok) {
        throw new Error("Kod noto'g'ri!");
      }

      // Agar API bizga user ma'lumotlarini qaytarsa
      const user = verifyResponse.user;

      if (user) {
        // --- TIMESTAMP VA DURATION ---
        const registrationTime = new Date().toISOString(); 

        // Parolni yangilash (agar API buni avtomatik qilmasa, qo'lda qilish kerak bo'lishi mumkin)
        // Eslatma: Bizning API hozircha faqat "login" qiladi, parolni o'zgartirmaydi.
        // Lekin xavfsizlik uchun, agar user yangi bo'lsa, parolni update qilishimiz mumkin:
        if (formData.password) {
             await supabase.auth.updateUser({ password: formData.password });
        }

        // --- PROFILNI SAQLASH ---
        const safeName = formData.name || "Noma'lum";
        const safeSurname = formData.surname || "Foydalanuvchi";

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert([
                { 
                    id: user.id, 
                    full_name: `${safeName} ${safeSurname}`,
                    phone: formData.fullPhone,
                    role: 'client',
                    created_at: registrationTime,
                    last_login: registrationTime
                }
            ]);

        if (profileError) throw profileError;

        message.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
        navigate("/", { replace: true });
      } else {
          throw new Error("Foydalanuvchi aniqlanmadi");
      }
    } catch (err) {
      console.error(err);
      message.error("Xatolik: " + (err.message || "Tasdiqlashda xato"));
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

          {/* HEADER QISMI */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 25 }}>
             <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')} type="text" shape="circle" />
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