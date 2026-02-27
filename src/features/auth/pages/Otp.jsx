import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Typography, message } from "antd";
import { ArrowLeftOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@shared/i18n/useLanguage";

const { Title, Text } = Typography;

function normalizePhone(raw) {
  const s = String(raw || "").trim();
  // Expecting +998XXXXXXXXX or 998XXXXXXXXX or XX XXX...
  const digits = s.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("998")) return "+" + digits;
  if (digits.length === 9) return "+998" + digits;
  return digits; // fallback (let supabase validate)
}

export default function Otp() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t } = useLanguage();

  const phone = useMemo(() => normalizePhone(params.get("phone") || ""), [params]);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    setSeconds(60);
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [phone]);

  const resend = async () => {
    if (!phone) return message.error(t?.enterPhone || "Telefon raqamini kiriting");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      message.success(t?.smsSent || "SMS kod yuborildi");
      setSeconds(60);
    } catch (e) {
      message.error(e?.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!phone) return message.error(t?.enterPhone || "Telefon raqamini kiriting");
    const token = String(code || "").replace(/\s/g, "");
    if (token.length < 4) return message.error(t?.enterSmsCode || "SMS kodni kiriting");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });
      if (error) throw error;

      // Default mode: client
      try { localStorage.setItem("app_mode", "client"); } catch(e) {}

      message.success(t?.success || "Tasdiqlandi");
      navigate("/", { replace: true });
    } catch (e) {
      message.error(e?.message || "Kod noto‘g‘ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-10 bg-[var(--app-bg)]">
      <Card
        className="w-full max-w-md"
        style={{
          borderRadius: 24,
          border: "1px solid var(--card-border)",
          background: "var(--card-bg)",
          boxShadow: "0 18px 60px rgba(0,0,0,.12)",
        }}
        bodyStyle={{ padding: 20 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
          <div>
            <Title level={4} style={{ margin: 0, color: "var(--card-text)" }}>
              {t?.smsVerification || "SMS tasdiqlash"}
            </Title>
            <Text style={{ color: "var(--muted)" }}>
              {phone ? `${t?.codeSentTo || "Kod yuborildi"}: ${phone}` : (t?.enterPhone || "Telefon raqamini kiriting")}
            </Text>
          </div>
        </div>

        <div className="mt-6">
          <Text style={{ color: "var(--muted)" }}>
            {t?.enterSmsCode || "SMS kodni kiriting"}
          </Text>

          <Input
            size="large"
            prefix={<SafetyCertificateOutlined />}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
            className="mt-2"
          />

          <Button
            type="primary"
            size="large"
            className="w-full mt-4"
            loading={loading}
            onClick={verify}
          >
            {t?.confirm || "Tasdiqlash"}
          </Button>

          <div className="flex items-center justify-between mt-4">
            <Text style={{ color: "var(--muted)" }}>
              {seconds > 0 ? `${t?.resendIn || "Qayta yuborish"}: ${seconds}s` : (t?.didntGetCode || "Kod kelmadimi?")}
            </Text>
            <Button disabled={seconds > 0 || loading} onClick={resend}>
              {t?.resend || "Qayta yuborish"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
