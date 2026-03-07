/**
 * DriverPending.jsx - TO'LIQ VA TO'G'IRLANGAN VERSIYA
 * * Location: src/pages/DriverPending.jsx
 * * TUZATISH: 
 * 1. Mavjud bo'lmagan useUserStore o'rniga useSessionProfile ishlatildi.
 * 2. AppModeProvider orqali rejimlararo o'tish (setAppMode) ulandi.
 * 3. Barcha holatlar (Pending, Approved, Rejected, None) uchun UI to'liq saqlandi.
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSessionProfile } from "@/shared/auth/useSessionProfile"; 
import { useAppMode } from "@/providers/AppModeProvider"; 

export default function DriverPending() {
  const navigate = useNavigate();
  const { setAppMode } = useAppMode(); 
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending"); // pending | approved | rejected | none
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  // useSessionProfile orqali foydalanuvchi ma'lumotlarini yuklaymiz
  const { loading: authLoading, user } = useSessionProfile({ 
    includeDriver: true, 
    includeApplication: true 
  }); 

  /**
   * Haydovchi holatini tekshirish funksiyasi
   */
  const fetchDriverStatus = async () => {
    if (checking) return;
    setChecking(true);

    try {
      setMessage("");

      // 1) Auth foydalanuvchini tekshirish
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const authUser = authData?.user;

      if (authError || !authUser) {
        console.warn("Foydalanuvchi aniqlanmadi");
        setLoading(false);
        setChecking(false);
        return;
      }

      // 2) Drivers jadvalidan joriy holatni olish
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (driverError) {
        console.error("Haydovchi ma'lumotlarini olishda xato:", driverError);
        setStatus("none");
        setMessage("Ma'lumotlarni yuklashda xatolik yuz berdi.");
      } else if (!driverData) {
        // Agar jadvalda haydovchi topilmasa
        setStatus("none");
        setMessage("Siz hali haydovchi sifatida ro'yxatdan o'tmagansiz.");
      } else {
        // Holatni aniqlash (is_approved yoki status ustuniga qarab)
        if (driverData.status === "approved" || driverData.is_approved === true) {
          setStatus("approved");
        } else if (driverData.status === "rejected") {
          setStatus("rejected");
          setMessage(driverData.rejection_reason || "Arizangiz rad etilgan.");
        } else {
          // Default holat - kutilmoqda
          setStatus("pending");
        }
      }
    } catch (e) {
      console.error("Kutilmagan xato:", e);
      setStatus("none");
      setMessage("Tizimda kutilmagan xatolik yuz berdi.");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  // Komponent yuklanganda tekshirishni ishga tushirish
  useEffect(() => {
    fetchDriverStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Yo'lovchi rejimiga qaytish
   */
  const handleReturnToClient = () => {
    if (typeof setAppMode === "function") {
      setAppMode("client");
    }
    navigate("/");
  };

  /**
   * Ro'yxatdan o'tish sahifasiga o'tish
   */
  const handleRegister = () => {
    navigate("/driver/register");
  };

  /**
   * Haydovchi paneliga o'tish
   */
  const handleGoToDashboard = () => {
    if (typeof setAppMode === "function") {
      setAppMode("driver");
    }
    navigate("/driver/dashboard");
  };

  // YUKLANISH HOLATI (SPINNER)
  if (loading || authLoading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        flexDirection: "column",
        gap: "15px",
        background: "#f9f9f9"
      }}>
        <div className="spinner" style={{ 
          width: "45px", 
          height: "45px", 
          border: "5px solid #f3f3f3", 
          borderTop: "5px solid #3498db", 
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <p style={{ color: "#555", fontWeight: "500" }}>Holat tekshirilmoqda...</p>
        <style>{`
          @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "20px", 
      maxWidth: "500px", 
      margin: "60px auto", 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
    }}>
      <div style={{ 
        backgroundColor: "white", 
        padding: "40px 30px", 
        borderRadius: "16px", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        textAlign: "center"
      }}>
        
        {/* 1. KUTILMOQDA (PENDING) */}
        {status === "pending" && (
          <div>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>⏳</div>
            <h2 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Arizangiz ko'rib chiqilmoqda</h2>
            <p style={{ color: "#7f8c8d", lineHeight: "1.6", fontSize: "15px" }}>
              Sizning haydovchilik arizangiz adminlar tomonidan tekshirilmoqda. 
              Odatda bu 24 soatgacha vaqt olishi mumkin. Arizangiz tasdiqlangach, xizmatlardan foydalanishingiz mumkin.
            </p>
            
            <button 
              onClick={handleReturnToClient}
              style={{
                marginTop: "30px",
                width: "100%",
                padding: "14px",
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "16px",
                transition: "background 0.3s"
              }}
            >
              Yo'lovchi Rejimiga Qaytish
            </button>
            
            <button 
              onClick={fetchDriverStatus}
              disabled={checking}
              style={{
                marginTop: "15px",
                display: "block",
                width: "100%",
                background: "none",
                border: "none",
                color: "#95a5a6",
                textDecoration: "underline",
                cursor: checking ? "not-allowed" : "pointer",
                fontSize: "14px"
              }}
            >
              {checking ? "Yangilanmoqda..." : "Hozirgi holatni yangilash"}
            </button>
          </div>
        )}

        {/* 2. TASDIQLANDI (APPROVED) */}
        {status === "approved" && (
          <div>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>✅</div>
            <h2 style={{ margin: "0 0 15px 0", color: "#27ae60" }}>Tabriklaymiz!</h2>
            <p style={{ color: "#7f8c8d", lineHeight: "1.6" }}>
              Arizangiz muvaffaqiyatli tasdiqlandi. Endi siz haydovchi rejimiga o'tib, buyurtmalarni qabul qilishingiz mumkin.
            </p>
            <button
              onClick={handleGoToDashboard}
              style={{
                marginTop: "30px",
                width: "100%",
                padding: "14px",
                backgroundColor: "#2ecc71",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "16px"
              }}
            >
              Dashboardga O'tish
            </button>
          </div>
        )}

        {/* 3. RAD ETILDI (REJECTED) */}
        {status === "rejected" && (
          <div>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>❌</div>
            <h2 style={{ margin: "0 0 15px 0", color: "#c0392b" }}>Arizangiz rad etildi</h2>
            <div style={{ 
              backgroundColor: "#fff5f5", 
              padding: "15px", 
              borderRadius: "10px", 
              color: "#c0392b",
              marginBottom: "25px",
              border: "1px solid #fed7d7",
              textAlign: "left"
            }}>
              <strong>Rad etilish sababi:</strong> <br />
              <span style={{ fontSize: "14px" }}>{message}</span>
            </div>
            
            <button
              onClick={handleRegister}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#e67e22",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
                marginBottom: "12px"
              }}
            >
              Ma'lumotlarni tahrirlab, qayta yuborish
            </button>
            
            <button 
              onClick={handleReturnToClient}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#f1f2f6",
                color: "#2f3542",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Yo'lovchi Rejimida Davom Etish
            </button>
          </div>
        )}

        {/* 4. XATOLIK YOKI NOANIQ (NONE) */}
        {status === "none" && (
          <div>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>⚠️</div>
            <h2 style={{ margin: "0 0 15px 0", color: "#f39c12" }}>Eslatma</h2>
            <p style={{ color: "#7f8c8d", marginBottom: "25px" }}>{message}</p>
            
            <button
              onClick={handleRegister}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
                marginBottom: "12px"
              }}
            >
              Haydovchi bo'lish uchun ro'yxatdan o'tish
            </button>
            
            <button 
              onClick={handleReturnToClient}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#f1f2f6",
                color: "#2f3542",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Asosiy Sahifaga Qaytish
            </button>
          </div>
        )}
      </div>
      
      <p style={{ 
        textAlign: "center", 
        marginTop: "30px", 
        color: "#bdc3c7", 
        fontSize: "12px" 
      }}>
        © 2026 Haydovchi Nazorat Tizimi
      </p>
    </div>
  );
}