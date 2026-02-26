import React, { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined, PhoneOutlined, ArrowLeftOutlined, LockOutlined, ReloadOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

import { BRAND } from "@/shared/config/brand";

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

  const onResend = async () => {
    if (!formData?.fullPhone) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: formData.fullPhone });
      if (error) throw error;
      message.success("SMS kod qayta yuborildi!");
    } catch (err) {
      message.error("Xatolik: " + (err?.message || ""));
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
        // Let RootRedirect (/) decide the correct start page.
        navigate("/", { replace: true });
      }
    } catch (err) {
      message.error("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6" style={{ background: "#E3EDF7" }}>
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg"
            style={{ background: BRAND.primary }}
          >
            <span className="text-white text-3xl font-black">{BRAND.short}</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight" style={{ color: "#1e293b" }}>{BRAND.name}</h1>
          <p className="font-medium mt-1 text-base" style={{ color: "#ec5b13" }}>{BRAND.slogan}</p>
        </div>

        <div className="rounded-3xl p-6 shadow-xl border border-white/60" style={{ background: "rgba(255,255,255,0.7)" }}>
          <div className="flex items-center mb-6">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/login")} type="text" shape="circle" />
            <div className="flex-1 text-center pr-10">
              <div className="text-xl font-bold" style={{ color: "#1e293b" }}>Ro'yxatdan o'tish</div>
              <div className="text-xs text-slate-500">1 daqiqada tugaydi</div>
            </div>
          </div>

          {step === 1 ? (
            <Form form={form} layout="vertical" onFinish={onGetOtp} size="large">
              <Form.Item
                label={<span className="text-sm font-medium text-slate-500">Ism</span>}
                name="name"
                rules={[{ required: true, message: "Ismingiz?" }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Ismingiz" />
              </Form.Item>

              <Form.Item
                label={<span className="text-sm font-medium text-slate-500">Familiya</span>}
                name="surname"
                rules={[{ required: true, message: "Familiyangiz?" }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Familiyangiz" />
              </Form.Item>

              <Form.Item
                label={<span className="text-sm font-medium text-slate-500">Telefon raqam</span>}
                name="phone"
                rules={[{ required: true, message: "Telefon?" }]}
              >
                <Input prefix={<PhoneOutlined />} addonBefore="+998" placeholder="90 123 45 67" />
              </Form.Item>

              <Form.Item
                label={<span className="text-sm font-medium text-slate-500">Parol</span>}
                name="password"
                rules={[{ required: true, min: 6, message: "Kamida 6 ta belgi" }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Yangi parol" />
              </Form.Item>

              <Button
                htmlType="submit"
                loading={loading}
                block
                className="!h-14 !rounded-2xl !font-extrabold"
                style={{ background: BRAND.dark, borderColor: BRAND.dark, color: "#fff" }}
              >
                SMS KOD OLISH
              </Button>
            </Form>
          ) : (
            <Form form={form} layout="vertical" onFinish={onVerifyOtp} size="large">
              <div className="rounded-xl p-4 text-center border" style={{ background: "#FFFBEB", borderColor: "#fde68a" }}>
                <div className="text-xs font-bold tracking-wide uppercase opacity-70 mb-1">Kod yuborildi:</div>
                <div className="text-lg font-mono font-bold tracking-wider text-black">{formData?.fullPhone}</div>
              </div>

              <Form.Item
                label={<span className="text-sm font-medium text-slate-500">SMS kod</span>}
                name="otp"
                rules={[{ required: true, len: 6, message: "6 xonali kod" }]}
                style={{ marginTop: 16 }}
              >
                <Input
                  inputMode="numeric"
                  placeholder="· · · · · ·"
                  maxLength={6}
                  style={{
                    textAlign: "center",
                    letterSpacing: "10px",
                    fontSize: 22,
                    fontWeight: 800,
                    height: 60,
                  }}
                />
              </Form.Item>

              <div className="flex justify-end -mt-2 mb-4">
                <Button type="text" icon={<ReloadOutlined />} onClick={onResend} disabled={loading}>
                  Kodni qayta yuborish
                </Button>
              </div>

              <Button
                htmlType="submit"
                loading={loading}
                block
                className="!h-14 !rounded-2xl !font-extrabold"
                style={{ background: BRAND.dark, borderColor: BRAND.dark, color: "#fff" }}
              >
                TASDIQLASH
              </Button>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}