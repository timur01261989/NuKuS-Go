import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

const { Title, Text } = Typography;

export default function DriverPending() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [role, setRole] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const checkStatus = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const user = authData?.user;
      if (!user?.id) {
        navigate("/login", { replace: true });
        return;
      }

      // Latest driver application status
      const { data: appRow, error: appError } = await supabase
        .from("driver_applications")
        .select("id,status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (appError) throw appError;

      if (!appRow) {
        // If user never applied, send to register
        navigate("/driver/register", { replace: true });
        return;
      }

      const currentStatus = appRow.status ?? null;
      setStatus(currentStatus);

      // Role gate usually reads profiles.role
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;

      const currentRole = profileRow?.role ?? null;
      setRole(currentRole);

      // Approved + role switched => let them into driver area
      if (currentStatus === "approved" && currentRole === "driver") {
        // If your driver home route is different, change it here.
        navigate("/driver", { replace: true });
        return;
      }

      // Approved but role not switched => explain
      if (currentStatus === "approved" && currentRole !== "driver") {
        setErrorMsg(
          "Ariza tasdiqlangan, lekin profilingiz 'driver' roliga o'tmagan. Supabase'da profiles.role = 'driver' qilib qo'ying."
        );
      }
    } catch (e) {
      setErrorMsg(e?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f5f6f8" }}>
      <Card style={{ width: 420, maxWidth: "100%", borderRadius: 16 }}>
        <Title level={4} style={{ marginTop: 0 }}>Haydovchi tasdiqlanmagan</Title>
        <Text type="secondary">
          Sizning haydovchi profilingiz admin tomonidan tekshirilmoqda. Tasdiqlangandan keyin haydovchi rejimiga kira olasiz.
        </Text>

        {(status || role) && (
          <div style={{ marginTop: 10 }}>
            <Text type="secondary">
              Status: <b>{status ?? "-"}</b> &nbsp;|&nbsp; Role: <b>{role ?? "-"}</b>
            </Text>
          </div>
        )}

        {errorMsg ? (
          <div style={{ marginTop: 12 }}>
            <Alert type="error" showIcon message={errorMsg} />
          </div>
        ) : null}

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <Button type="primary" style={{ background: "#000", borderColor: "#000" }} loading={loading} onClick={checkStatus}>
            Qayta tekshir
          </Button>
          <Button onClick={() => navigate("/client")}>Yolovchi rejimiga qaytish</Button>
          <Button onClick={() => navigate("/driver-mode")}>Ma’lumotlarni ko‘rish</Button>
        </div>
      </Card>
    </div>
  );
}
