import React, { useState, useEffect } from "react";
import { Form, Input, Button, Checkbox, message, Dropdown } from "antd";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/i18n/useLanguage";
import { LockOutlined, GlobalOutlined, PhoneOutlined } from "@ant-design/icons";

import { translations } from "@i18n/translations";
import { supabase } from "@/lib/supabase";

import { BRAND } from "@/shared/config/brand";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { langKey, setLangKey, t } = useLanguage();

  const languages = [
    { key: "uz_lotin", label: "O'zbek (Lotin)" },
    { key: "uz_kirill", label: "Ўзбек (Кирилл)" },
    { key: "qq_lotin", label: "Qaraqalpaq (Lotin)" },
    { key: "qq_kirill", label: "Қарақалпақ (Кирилл)" },
    { key: "ru", label: "Русский" },
    { key: "en", label: "English" },
  ];

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase?.auth) return;
      const { data } = await supabase.auth.getSession();
      // If user is already logged in, redirect to RootRedirect (/)
      // which will decide the correct destination based on app_mode and user role.
      if (data?.session) {
        navigate("/", { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleLangChange = ({ key }) => {
    setLangKey(key);
    message.success("Til o'zgartirildi");
  };

  const formatUzPhone = (rawPhone) => {
    let digits = String(rawPhone || "").replace(/\D/g, "");
    if (digits.length === 9) digits = "998" + digits;
    if (!digits.startsWith("998")) digits = "998" + digits;
    digits = digits.slice(0, 12);
    return "+" + digits;
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const phone = formatUzPhone(values.phone);

      const { error } = await supabase.auth.signInWithPassword({
        phone,
        password: values.password,
      });

      if (error) throw error;

      message.success(t?.greeting || "Xush kelibsiz!");
      
      // Default: app_mode ni "client" ga reset qil agar belgilanmagan bo'lsa
      // Agar user haydovchi bo'lishni xohlasa, /driver-mode tugmasini bosganda app_mode="driver" bo'ladi
      try { localStorage.setItem("app_mode", "client"); } catch(e) {}
      
      // RootRedirect (/) quyidagilni tekshiradi:
      // - app_mode="client" → /client/home
      // - app_mode="driver" → /driver/register, /driver/pending, yoki /driver/dashboard
      navigate("/", { replace: true });
    } catch {
      message.error("Telefon raqam yoki parol noto'g'ri!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg,#E0F2FE 0%,#DBEAFE 100%)" }}
    >
      <div className="absolute top-5 right-5">
        <Dropdown menu={{ items: languages, onClick: handleLangChange }} trigger={["click"]}>
          <Button icon={<GlobalOutlined />} shape="round">
            {languages.find((l) => l.key === langKey)?.label || "Til"}
          </Button>
        </Dropdown>
      </div>

      <main className="w-full max-w-sm">
        <header className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-4 rotate-3"
            style={{ background: BRAND.primary }}
            aria-label="logo"
          >
            <span className="text-white text-3xl font-black tracking-tighter">{BRAND.short}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: BRAND.dark }}>
            {BRAND.name}
          </h1>
          <p className="font-medium tracking-wide uppercase text-sm mt-1" style={{ color: BRAND.accent }}>
            {BRAND.slogan}
          </p>
        </header>

        <section className="rounded-3xl p-8 shadow-lg border border-white/20 bg-white/90 backdrop-blur">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            {t?.loginTitle || "Tizimga kirish"}
          </h2>

          <Form name="login_form" onFinish={onFinish} layout="vertical" size="large">
            <Form.Item
              label={<span className="text-xs font-semibold text-gray-500 uppercase">Telefon raqam</span>}
              name="phone"
              rules={[{ required: true, message: "Telefon raqam!" }]}
            >
              <Input prefix={<PhoneOutlined />} addonBefore="+998" placeholder="90 123 45 67" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-gray-500 uppercase">Parol</span>}
              name="password"
              rules={[{ required: true, message: "Parol!" }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
            </Form.Item>

            <div className="flex items-center justify-between text-sm -mt-1 mb-4">
              <Checkbox>{t.remember || "Eslab qolish"}</Checkbox>
              <button
                type="button"
                className="font-medium hover:underline"
                style={{ color: BRAND.accent }}
                onClick={() => navigate("/reset-password")}
              >
                Parolni unutdingizmi?
              </button>
            </div>

            <Button
              htmlType="submit"
              loading={loading}
              block
              className="!h-12 !rounded-xl !font-bold"
              style={{ background: BRAND.primary, borderColor: BRAND.primary, color: "#fff" }}
            >
              KIRISH
            </Button>

            <div className="text-center mt-6 text-gray-500">
              Hisobingiz yo'qmi?
              <button
                type="button"
                className="ml-2 font-bold hover:underline"
                style={{ color: BRAND.accent }}
                onClick={() => navigate("/register")}
              >
                Ro'yxatdan o'tish
              </button>
            </div>
          </Form>
        </section>
      </main>
    </div>
  );
}
