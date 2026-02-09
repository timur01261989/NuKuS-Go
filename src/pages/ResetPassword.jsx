import React, { useState } from 'react';
import { Button, Input, Form, Card, Typography, Space, message, ConfigProvider, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, PhoneOutlined, LockOutlined, CheckCircleOutlined, SafetyOutlined } from '@ant-design/icons';
import { translations } from "./translations"; 

const { Title, Text } = Typography;

export default function ResetPassword() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // Parol kuchi
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  const handleFinishData = (values) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (step === 1) {
        message.success(t.smsSent || "SMS kod yuborildi");
        setStep(2);
      } else {
        message.success(t.successPass || "Parol o'zgartirildi");
        navigate('/login');
      }
    }, 1500);
  };

  // Telefon raqamni formatlash (90 123 45 67)
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 9) value = value.slice(0, 9);

    let formattedValue = value;
    if (value.length > 2) formattedValue = `${value.slice(0, 2)} ${value.slice(2)}`;
    if (value.length > 5) formattedValue = `${formattedValue.slice(0, 6)} ${value.slice(5)}`;
    if (value.length > 7) formattedValue = `${formattedValue.slice(0, 9)} ${value.slice(7)}`;

    form.setFieldsValue({ phone: formattedValue });
  };

  // SMS Kodni faqat raqam qilib olish
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    form.setFieldsValue({ smsCode: value });
  };

  // Parol kuchini tekshirish
  const checkPasswordStrength = (e) => {
    const pass = e.target.value;
    let score = 0;
    if (pass.length > 5) score += 30;
    if (pass.length > 8) score += 30;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 20;
    setPasswordStrength(score);
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#000000', borderRadius: 16 } }}>
      <div style={{ 
        height: "100vh", 
        background: "linear-gradient(135deg, #FFD700 0%, #FFC107 100%)", 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "flex-end",
        overflow: "hidden",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>

        {/* Yuqori qism - Header */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: 'relative' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            type="text" 
            onClick={() => step === 2 ? setStep(1) : navigate('/login')}
            style={{ position: 'absolute', top: 20, left: 10, fontSize: 18, color: '#000' }}
          />
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: 15, borderRadius: '50%', marginBottom: 15, backdropFilter: 'blur(5px)' }}>
             <SafetyOutlined style={{ fontSize: 40, color: '#000' }} />
          </div>
          <Title level={2} style={{ margin: 0, fontWeight: 900, color: '#000' }}>Nukus Go</Title>
          <Text style={{ opacity: 0.7, fontWeight: 600, color: '#000' }}>{t.resetTitle?.toUpperCase()}</Text>
        </div>

        {/* Asosiy blok */}
        <Card bordered={false} style={{ borderRadius: "32px 32px 0 0", boxShadow: "0 -10px 40px rgba(0,0,0,0.1)", padding: "10px 5px" }}>

          {step === 1 ? (
            <Form form={form} layout="vertical" onFinish={handleFinishData} size="large" autoComplete="off">
              <Title level={4} style={{ marginBottom: 10, textAlign: 'center' }}>{t.resetTitle}</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 30, textAlign: 'center' }}>{t.enterPhone}</Text>

              {/* Telefon */}
              <Form.Item name="phone" rules={[{ required: true, message: 'Telefon raqam kiriting!' }]}>
                <Input 
                  prefix={<Space><PhoneOutlined style={{ color: "#aaa" }} /><Text strong style={{ color: "#333" }}>+998</Text></Space>} 
                  placeholder="90 123 45 67" 
                  onChange={handlePhoneChange}
                  style={{ borderRadius: "16px", height: 55, background: "#f9f9f9", border: '1px solid #eee' }} 
                />
              </Form.Item>

              <Button 
                type="primary" htmlType="submit" block loading={loading} 
                style={{ 
                  height: 55, borderRadius: "16px", background: "black", fontSize: 16, fontWeight: 800, marginTop: 10,
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)", transition: "transform 0.1s"
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.97)"}
                onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {t.sendCode || "KODNI YUBORISH"}
              </Button>
            </Form>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <Title level={4} style={{ marginBottom: 5 }}>{t.resetTitle}</Title>
              <Text type="secondary">{t.enterSms}</Text>

              <Form form={form} layout="vertical" onFinish={handleFinishData} size="large" style={{ marginTop: 25 }}>

                  {/* SMS Kod */}
                  <Form.Item name="smsCode" rules={[{ required: true, message: 'Kodni kiriting!' }, { len: 4, message: '4 xona!' }]}>
                    <Input 
                       onChange={handleCodeChange}
                       style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', borderRadius: 16, height: 65, letterSpacing: 15, background: '#f9f9f9', border: '1px solid #eee' }} 
                       placeholder="0000" maxLength={4} inputMode="numeric"
                    />
                  </Form.Item>

                  {/* Yangi parol */}
                  <Form.Item name="newPassword" rules={[{ required: true, message: 'Yangi parol kiriting!' }, { min: 6, message: 'Eng kamida 6 ta belgi' }]}>
                    <Input.Password 
                        prefix={<LockOutlined style={{ color: "#aaa" }} />} 
                        placeholder={t.newPassword || "Yangi parol"} 
                        onChange={checkPasswordStrength}
                        style={{ borderRadius: "16px", height: 55, background: "#f9f9f9", border: '1px solid #eee' }} 
                    />
                  </Form.Item>

                  {/* Parol kuchi indikatori */}
                  {passwordStrength > 0 && (
                     <div style={{ marginBottom: 20, marginTop: -15, padding: '0 5px' }}>
                        <Progress 
                          percent={passwordStrength} showInfo={false} size="small" 
                          strokeColor={passwordStrength < 50 ? "#ff4d4f" : passwordStrength < 80 ? "#faad14" : "#52c41a"} 
                        />
                        <Text type="secondary" style={{ fontSize: 10, float: 'left' }}>
                          {passwordStrength < 50 ? "Juda oddiy" : passwordStrength < 80 ? "O'rtacha" : "Kuchli parol"}
                        </Text>
                     </div>
                  )}

                  {/* Parolni tasdiqlash */}
                  <Form.Item 
                    name="confirm" 
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Parolni tasdiqlang!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error(t.passMismatch || "Parollar mos kelmadi!"));
                        },
                      }),
                    ]}
                  >
                    <Input.Password 
                        prefix={<CheckCircleOutlined style={{ color: "#aaa" }} />} 
                        placeholder={t.confirmPassword || "Parolni tasdiqlang"} 
                        style={{ borderRadius: "16px", height: 55, background: "#f9f9f9", border: '1px solid #eee' }} 
                    />
                  </Form.Item>

                  <Button 
                    type="primary" block htmlType="submit" loading={loading}
                    style={{ 
                      height: 55, borderRadius: 16, background: 'black', fontWeight: 800, 
                      boxShadow: "0 4px 15px rgba(0,0,0,0.2)", transition: "transform 0.1s"
                    }} 
                    onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
                    onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                    onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.97)"}
                    onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    {t.save || "SAQLASH"}
                  </Button>

                  <Button type="link" onClick={() => setStep(1)} style={{ color: '#888', marginTop: 15, fontWeight: 600 }}>{t.back || "Ortga"}</Button>
              </Form>
            </div>
          )}
        </Card>
      </div>
    </ConfigProvider>
  );
}