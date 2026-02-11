import React, { useState, useEffect, useCallback } from "react";
import { Button, Result, Card, Skeleton, message, Typography } from "antd"; 
import { ClockCircleOutlined, StopOutlined, ReloadOutlined, ArrowLeftOutlined } from "@ant-design/icons"; 
import { useNavigate } from "react-router-dom";
import { supabase } from "@lib/supabase";
import DriverHome from "./DriverHome";
import DriverRegister from "./DriverRegister";

export default function DriverAuth({ onBack }) { 
  const navigate = useNavigate();

  // Statuslar: 'loading' | 'none' | 'pending' | 'active' | 'blocked'
  const [status, setStatus] = useState("loading"); 
  const [loading, setLoading] = useState(false); // Tugma uchun loading

  // --- 1. HAYDOVCHI STATUSINI TEKSHIRISH (LOGIKA) ---
  const checkDriverStatus = useCallback(async () => {
    try {
      // 1. Foydalanuvchi tizimga kirganmi?
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
         // Agar login qilmagan bo'lsa, bosh sahifaga otib yuboramiz
         if (onBack) onBack(); else navigate("/");
         return;
      }

      // 2. Bazadan haydovchini qidiramiz
      const { data, error } = await supabase
        .from('drivers')
        .select('status')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
          console.error("Baza xatosi:", error);
          message.error("Tizimda xatolik yuz berdi");
      }

      // 3. Statusni aniqlash
      if (!data) {
         setStatus("none"); // Bazada yo'q -> Ro'yxatdan o'tishga
      } else {
         setStatus(data.status); // 'pending', 'active' yoki 'blocked'
      }

    } catch (err) {
       console.error("Tarmoq xatosi:", err);
       message.error("Internet aloqasini tekshiring");
    }
  }, [navigate, onBack]);

  // Sahifa ochilganda ishga tushadi
  useEffect(() => {
    checkDriverStatus();
  }, [checkDriverStatus]);

  // --- YORDAMCHI FUNKSIYALAR ---

  // Asosiy ilovaga qaytish
  const goBackMain = () => {
      if (onBack) onBack(); 
      else navigate("/");
  };

  // Statusni qayta tekshirish (Refresh)
  const handleRefresh = () => {
    setLoading(true);
    checkDriverStatus();
    // 1 soniyadan keyin loadingni o'chiramiz (chiroyli effekt uchun)
    setTimeout(() => {
        setLoading(false);
        if (status === 'pending') message.info("Hozircha o'zgarish yo'q, kuting...");
    }, 1000);
  };

  // --- RENDER QISMI (ROUTER) ---

  // 1. YUKLANMOQDA (SKELETON)
  if (status === "loading") {
      return (
        <div style={{ padding: 40, background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 20 }}>
           <Skeleton.Button active size="large" block style={{ height: 50 }} />
           <Skeleton active avatar paragraph={{ rows: 4 }} />
           <Skeleton.Image active style={{ width: '100%', height: 200 }} />
        </div>
      );
  }

  // 2. AKTIV HAYDOVCHI -> ISH STOLIGA (DRIVER HOME)
  if (status === "active") {
      // Eng muhim joyi: Agar active bo'lsa, biz boshqaruvni DriverHome ga beramiz.
      // onLogout funksiyasi DriverHome dagi "Chiqish" tugmasi uchun.
      return <DriverHome onLogout={goBackMain} />;
  }

  // 3. YANGI FOYDALANUVCHI -> RO'YXATDAN O'TISH
  if (status === "none") {
      return (
        <div style={{ minHeight: "100vh", background: "#fff" }}>
            <div style={{ padding: "15px 15px 0" }}>
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={goBackMain} 
                    style={{ border: 'none', height: 40, borderRadius: 12, fontWeight: 600 }}
                >
                    Asosiy menyuga qaytish
                </Button>
            </div>
            {/* Ro'yxatdan o'tib bo'lgach, statusni 'pending' ga o'zgartiramiz */}
            <DriverRegister onRegisterSuccess={() => setStatus("pending")} />
        </div>
      );
  }

  // 4. KUTILMOQDA (PENDING)
  if (status === "pending") {
      return (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f0f2f5", padding: 20 }}>
            <Card style={{ width: '100%', maxWidth: 400, textAlign: "center", borderRadius: 30, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <Result
                icon={<ClockCircleOutlined style={{ color: "#faad14", fontSize: 70 }} />}
                title={<Title level={3}>Arizangiz ko'rib chiqilmoqda</Title>}
                subTitle={<Text type="secondary">Sizning ma'lumotlaringiz Admin tomonidan tekshirilmoqda. Bu jarayon biroz vaqt olishi mumkin.</Text>}
                extra={[
                   <Button 
                       key="refresh" 
                       type="primary" 
                       icon={<ReloadOutlined />}
                       onClick={handleRefresh} 
                       loading={loading} 
                       size="large"
                       style={{ background: '#000', borderColor: '#000', width: '100%', borderRadius: 15, marginBottom: 15, height: 50 }}
                   >
                       Holatni tekshirish
                   </Button>,
                   <Button 
                       key="back" 
                       onClick={goBackMain} 
                       size="large"
                       style={{ width: '100%', borderRadius: 15, height: 50 }}
                   >
                       Ortga qaytish
                   </Button>
                ]}
              />
            </Card>
          </div>
      );
  }

  // 5. BLOKLANGAN (BLOCKED)
  if (status === "blocked") {
      return (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#fff1f0", padding: 20 }}>
            <Card style={{ width: '100%', maxWidth: 400, textAlign: "center", borderRadius: 30, border: 'none' }}>
              <Result
                icon={<StopOutlined style={{ color: "#ff4d4f", fontSize: 70 }} />}
                status="error"
                title={<Title level={3} type="danger">Profilingiz Bloklandi</Title>}
                subTitle="Qoidabuzarlik yoki to'lovlar sababli sizning haydovchilik profilingiz vaqtincha to'xtatildi."
                extra={[
                   <Button key="contact" type="primary" danger size="large" style={{ width: '100%', borderRadius: 15, marginBottom: 10 }}>
                       Admin bilan bog'lanish
                   </Button>,
                   <Button key="back" onClick={goBackMain} size="large" style={{ width: '100%', borderRadius: 15 }}>
                       Chiqish
                   </Button>
                ]}
              />
            </Card>
          </div>
      );
  }

  return null;
}
