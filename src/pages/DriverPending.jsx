import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Result, Spin, Typography } from "antd";
import { supabase } from "@/lib/supabase";
import { useAppMode } from "@/providers/AppModeProvider";

const { Paragraph } = Typography;

export default function DriverPending() {
  const navigate = useNavigate();
  const { setAppMode } = useAppMode();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [reason, setReason] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user?.id) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: app } = await supabase
        .from("driver_applications")
        .select("status,rejection_reason,updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: driver } = await supabase
        .from("drivers")
        .select("is_verified")
        .eq("user_id", user.id)
        .maybeSingle();

      if (driver?.is_verified || String(app?.status || "").toLowerCase() === "approved") {
        setStatus("approved");
      } else if (!app) {
        setStatus("none");
      } else {
        setStatus(String(app.status || "pending").toLowerCase());
        setReason(app.rejection_reason || "");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spin size="large" /></div>;
  }

  if (status === "approved") {
    return (
      <Card style={{ maxWidth: 620, margin: "40px auto", borderRadius: 20 }}>
        <Result
          status="success"
          title="Arizangiz tasdiqlandi"
          subTitle="Driver profili aktiv. Endi dashboard ga o'tib online bo'lishingiz mumkin."
          extra={<Button type="primary" onClick={() => { setAppMode("driver"); navigate("/driver/dashboard", { replace: true }); }}>Dashboard ga o'tish</Button>}
        />
      </Card>
    );
  }

  if (status === "rejected" || status === "revoked") {
    return (
      <Card style={{ maxWidth: 620, margin: "40px auto", borderRadius: 20 }}>
        <Result
          status="error"
          title="Ariza rad etildi"
          subTitle="Ma'lumotlarni qayta tahrirlab yana yuborishingiz mumkin."
          extra={[
            <Button key="edit" type="primary" onClick={() => navigate("/driver/register", { replace: true })}>Qayta topshirish</Button>,
            <Button key="client" onClick={() => { setAppMode("client"); navigate("/client/home", { replace: true }); }}>Client rejimiga qaytish</Button>,
          ]}
        />
        {reason ? <Paragraph><strong>Sabab:</strong> {reason}</Paragraph> : null}
      </Card>
    );
  }

  if (status === "none") {
    return (
      <Card style={{ maxWidth: 620, margin: "40px auto", borderRadius: 20 }}>
        <Result
          status="warning"
          title="Driver arizasi topilmadi"
          subTitle="Avval driver arizasini yuboring."
          extra={<Button type="primary" onClick={() => navigate("/driver/register", { replace: true })}>Ro'yxatdan o'tish</Button>}
        />
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: 620, margin: "40px auto", borderRadius: 20 }}>
      <Result
        status="info"
        title="Arizangiz tekshirilmoqda"
        subTitle="Admin panel alohida web loyiha bo'ladi. Driver huquqlari faqat tasdiqlangandan keyin ochiladi."
        extra={[
          <Button key="refresh" type="primary" onClick={refresh}>Holatni yangilash</Button>,
          <Button key="client" onClick={() => { setAppMode("client"); navigate("/client/home", { replace: true }); }}>Client rejimiga qaytish</Button>,
        ]}
      />
    </Card>
  );
}
