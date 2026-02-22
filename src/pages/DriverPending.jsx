import React, { useEffect, useState } from "react";
import { Button, Card, Typography, Spin, message } from "antd";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const { Title, Text } = Typography;

export default function DriverPending() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Har 3 soniyada status tekshirish
  useEffect(() => {
    let interval;
    const checkStatus = async () => {
      try {
        setCheckingStatus(true);
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;

        if (userId) {
          const { data: driver, error } = await supabase
            .from("drivers")
            .select("status, approved")
            .eq("user_id", userId)
            .maybeSingle();

          if (error) {
            console.error("Status tekshirishda xato:", error);
            return;
          }

          if (driver) {
            // Status approved yoki active bo'lsa dashboard ga yo'naltir
            const isApproved = 
              driver.approved === true || 
              (driver.status && ["approved", "active", "verified", "enabled", "ok"].includes(driver.status.toLowerCase()));

            if (isApproved) {
              message.success("Haydovchi tasdiqlanadi! Dashboordga jo'natilmoqda...");
              setTimeout(() => {
                navigate("/driver/dashboard", { replace: true });
              }, 500);
            }
          }
        }
      } catch (err) {
        console.error("Status tekshirish xatosi:", err);
      } finally {
        setCheckingStatus(false);
      }
    };

    // Avvalo darhol tekshir
    checkStatus();

    // Keyin 3 soniyada bir tekshir
    interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (userId) {
        const { data: driver, error } = await supabase
          .from("drivers")
          .select("status, approved")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;

        if (driver) {
          const isApproved = 
            driver.approved === true || 
            (driver.status && ["approved", "active", "verified", "enabled", "ok"].includes(driver.status.toLowerCase()));

          if (isApproved) {
            message.success("Siz tasdiqlandingiz! Dashboordga yo'natilmoqda...");
            navigate("/driver/dashboard", { replace: true });
          } else {
            message.info(`Holatiniz: ${driver.status || 'kutib turuvchi'}. Admin tekshiravda..`);
          }
        }
      }
    } catch (err) {
      message.error("Tekshirishda xato: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f5f6f8" }}>
      <Card style={{ width: 450, maxWidth: "100%", borderRadius: 16 }}>
        <Title level={4} style={{ marginTop: 0 }}>⏳ Haydovchi tasdiqlanmagan</Title>
        <Text type="secondary">
          Sizning haydovchi profilingiz admin tomonidan tekshirilmoqda. Tasdiqlangandan keyin haydovchi rejimiga avtomatik kirish amalga oshadi.
        </Text>
        
        <div style={{ marginTop: 20, padding: 12, background: "#f0f0f0", borderRadius: 8 }}>
          {checkingStatus && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Spin size="small" />
              <Text type="secondary" style={{ fontSize: 12 }}>Status tekshirilmoqda...</Text>
            </div>
          )}
          {!checkingStatus && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Status har 3 soniyada avtomatik tekshiriladi. Shuningdek quyidagi "Qayta tekshir" tugmasini bosishingiz mumkin.
            </Text>
          )}
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <Button 
            type="primary" 
            style={{ background: "#000", borderColor: "#000" }} 
            onClick={handleRefresh}
            loading={loading}
            block
          >
            Qayta tekshir
          </Button>
          
          <Button 
            onClick={() => navigate("/client")}
            block
          >
            Yolovchi rejimiga qaytish
          </Button>
        </div>
      </Card>
    </div>
  );
}
