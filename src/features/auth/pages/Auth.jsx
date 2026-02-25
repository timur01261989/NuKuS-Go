import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Card,
  message,
  ConfigProvider,
  Dropdown,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/i18n/useLanguage";
import { LockOutlined, GlobalOutlined, PhoneOutlined } from "@ant-design/icons";

import { translations } from "@i18n/translations";
import { supabase } from "@/lib/supabase";

const { Title, Text } = Typography;

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
      // Navigate to RootRedirect (/) which will decide the correct destination
      // based on app_mode and user's profile/driver status.
      navigate("/", { replace: true });
    } catch {
      message.error("Telefon raqam yoki parol noto'g'ri!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#FFD700" } }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f0f2f5",
          padding: 20,
        }}
      >
        <div style={{ position: "absolute", top: 20, right: 20 }}>
          <Dropdown menu={{ items: languages, onClick: handleLangChange }} trigger={["click"]}>
            <Button icon={<GlobalOutlined />} shape="round">
              {languages.find((l) => l.key === langKey)?.label || "Til"}
            </Button>
          </Dropdown>
        </div>

        <Card
          style={{
            width: 400,
            borderRadius: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
          bordered={false}
        >
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div
              style={{
                width: 60,
                height: 60,
                background: "#FFD700",
                borderRadius: 15,
                margin: "0 auto 15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 30, fontWeight: "bold" }}>GO</span>
            </div>
            <Title level={3}>Nukus Go</Title>
            <Text type="secondary">Kirish</Text>
          </div>

          <Form name="login_form" onFinish={onFinish} size="large">
            <Form.Item name="phone" rules={[{ required: true, message: "Telefon raqam!" }]}>
              <Input
                prefix={<PhoneOutlined />}
                addonBefore="+998"
                placeholder="90 123 45 67"
              />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: "Parol!" }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Parol" />
            </Form.Item>

            <Form.Item>
              <Checkbox>{t.remember || "Eslab qolish"}</Checkbox>
              <a
                style={{ float: "right", color: "#FFD700", fontWeight: "bold" }}
                onClick={() => navigate("/reset-password")}
              >
                Parolni unutdingizmi?
              </a>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  background: "black",
                  borderColor: "black",
                  height: 50,
                  borderRadius: 10,
                  fontWeight: "bold",
                }}
              >
                KIRISH
              </Button>
            </Form.Item>

            <div style={{ textAlign: "center" }}>
              <Text>Hisobingiz yo'qmi? </Text>
              <a onClick={() => navigate("/register")} style={{ color: "#FFD700", fontWeight: "bold" }}>
                Ro'yxatdan o'tish
              </a>
            </div>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  );
}
