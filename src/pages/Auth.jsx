import React, { useState, useEffect } from "react";
import { 
  Form, Input, Button, Checkbox, Typography, Card, 
  message, ConfigProvider, Dropdown 
} from "antd";
import { useNavigate } from "react-router-dom";
import { LockOutlined, GlobalOutlined, PhoneOutlined } from "@ant-design/icons";

import { translations } from "./translations"; 
import { supabase } from "../lib/supabase"; 

const { Title, Text } = Typography;

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const [langKey, setLangKey] = useState(savedLang);
  const t = translations[langKey] || translations["uz_lotin"];

  const languages = [
    { key: 'uz_lotin', label: "O'zbek (Lotin)" },
    { key: 'uz_kirill', label: "Ўзбек (Кирилл)" },
    { key: 'qq_lotin', label: "Qaraqalpaq (Lotin)" },
    { key: 'qq_kirill', label: "Қарақалпақ (Кирилл)" },
    { key: 'ru', label: "Русский" },
    { key: 'en', label: "English" },
  ];

  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) navigate("/dashboard");
    };
    checkSession();
  }, [navigate]);

  const handleLangChange = ({ key }) => {
    setLangKey(key);
    localStorage.setItem("appLang", key);
    message.success("Til o'zgartirildi");
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 1. Telefonni formatlash
      let formattedPhone = values.phone.replace(/\D/g, ''); 
      if (!formattedPhone.startsWith("998")) formattedPhone = "998" + formattedPhone;
      formattedPhone = "+" + formattedPhone;

      // 2. TELEFON VA PAROL ORQALI KIRISH
      // Email ishlatmaymiz, to'g'ridan-to'g'ri 'phone' beramiz
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: formattedPhone, 
        password: values.password,
      });

      if (error) throw error;

      message.success(t?.greeting || "Xush kelibsiz!");
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      message.error("Telefon raqam yoki parol noto'g'ri!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#FFD700' } }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f0f2f5", padding: 20 }}>

        <div style={{ position: "absolute", top: 20, right: 20 }}>
          <Dropdown menu={{ items: languages, onClick: handleLangChange }} trigger={['click']}>
            <Button icon={<GlobalOutlined />} shape="round">
              {languages.find(l => l.key === langKey)?.label || "Til"}
            </Button>
          </Dropdown>
        </div>

        <Card style={{ width: 400, borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} bordered={false}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{ width: 60, height: 60, background: "#FFD700", borderRadius: 15, margin: "0 auto 15px", display: "flex", alignItems: "center", justifyContent: "center" }}>
               <span style={{ fontSize: 30, fontWeight: "bold" }}>GO</span>
            </div>
            <Title level={3}>Nukus Go</Title>
            <Text type="secondary">Kirish</Text>
          </div>

          <Form name="login_form" initialValues={{ remember: true }} onFinish={onFinish} size="large">

            <Form.Item name="phone" rules={[{ required: true, message: 'Telefon raqam!' }]}>
              <Input 
                prefix={<PhoneOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                addonBefore="+998"
                placeholder="90 123 45 67" 
                type="number"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: 'Parol!' }]}>
              <Input.Password
                prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                placeholder="Parol"
              />
            </Form.Item>

            <Form.Item>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>{t.remember || "Eslab qolish"}</Checkbox>
              </Form.Item>
              <a style={{ float: "right", color: "#FFD700", cursor: "pointer", fontWeight: "bold" }} onClick={() => navigate('/reset-password')}>
                Parolni unutdingizmi?
              </a>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ background: "black", borderColor: "black", height: 50, borderRadius: 10, fontWeight: "bold" }}>
                KIRISH
              </Button>
            </Form.Item>

            <div style={{ textAlign: "center" }}>
              <Text>Hisobingiz yo'qmi? </Text> 
              <a onClick={() => navigate('/register')} style={{ color: "#FFD700", fontWeight: "bold", cursor: "pointer" }}>
                Ro'yxatdan o'tish
              </a>
            </div>

            <div style={{ textAlign: "center", marginTop: 15, borderTop: '1px solid #eee', paddingTop: 15 }}>
              <Text type="secondary">Haydovchimisiz?</Text> <br/>
              <a onClick={() => navigate('/driver-mode')} style={{ color: "#000", fontWeight: "bold", cursor: "pointer", textDecoration: 'underline' }}>
                 Haydovchi sifatida kirish
              </a>
            </div>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  );
}