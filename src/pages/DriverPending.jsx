/**
 * DriverPending.jsx - TO'LIQ VA TO'G'IRLANGAN VERSIYA
 * -------------------------------------------------------
 * Loyiha: Haydovchi arizasini tekshirish sahifasi
 * Tuzatish: useUserStore xatoligi olib tashlandi va loyiha 
 * standartlariga moslashtirildi.
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

  // useSessionProfile orqali tizimdagi foydalanuvchi ma'lumotlarini yuklaymiz
  const { loading: authLoading, user } = useSessionProfile({ 
    includeDriver: true, 
    includeApplication: true 
  }); 

  /**
   * fetchDriverStatus
   * Supabase-dan haydovchining joriy holatini tekshirish
   */
  const fetchDriverStatus = async () => {
    if (checking) return;
    setChecking(true);

    try {
      setMessage("");

      // 1. Foydalanuvchi auth holatini aniqlash
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const authUser = authData?.user;

      if (authError || !authUser) {
        console.warn("Foydalanuvchi tizimga kirmagan.");
        setLoading(false);
        setChecking(false);
        return;
      }

      // 2. 'drivers' jadvalidan haydovchi ma'lumotlarini qidirish
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (driverError) {
        console.error("Bazadan ma'lumot olishda xato:", driverError);
        setStatus("none");
        setMessage("Ma'lumotlarni yuklashda texnik xatolik yuz berdi.");
      } else if (!driverData) {
        // Agar foydalanuvchi haydovchi sifatida bazada yo'q bo'lsa
        setStatus("none");
        setMessage("Siz hali haydovchi sifatida ro'yxatdan o'tmagansiz.");
      } else {
        // 3. Statusni aniqlash (bazadagi 'status' yoki 'is_approved' ustunlariga ko'ra)
        if (driverData.status === "approved" || driverData.is_approved === true) {
          setStatus("approved");
        } else if (driverData.status === "rejected") {
          setStatus("rejected");
          setMessage(driverData.rejection_reason || "Arizangiz talablarga javob bermagani uchun rad etilgan.");
        } else {
          // 'pending' holati
          setStatus("pending");
        }
      }
    } catch (e) {
      console.error("Kutilmagan xato:", e);
      setStatus("none");
      setMessage("Tizimda kutilmagan xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  // Sahifa yuklanganda avtomatik tekshirish
  useEffect(() => {
    fetchDriverStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Tugma funksiyalari
   */
  const handleReturnToClient = () => {
    if (setAppMode) setAppMode("client");
    navigate("/");
  };

  const handleRegister = () => {
    navigate("/driver/register");
  };

  const handleGoToDashboard = () => {
    if (setAppMode) setAppMode("driver");
    navigate("/driver/dashboard");
  };

  // -------------------------------------------------------
  // RENDER: YUKLANISH (SPINNER)
  // -------------------------------------------------------
  if (loading || authLoading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        flexDirection: "column",
        gap: "15px",
        background: "#f7f9fc"
      }}>
        <div className="spinner-ui" style={{ 
          width: "50px", 
          height: "50px", 
          border: "6px solid #e0e0e0", 
          borderTop: "6px solid #1677ff", 
          borderRadius: "50%",
          animation: "spin-animation 1s linear infinite"
        }}></div>
        <p style={{ color: "#8c8c8c", fontSize: "16px", fontWeight: "500" }}>
          Ma'lumotlar tekshirilmoqda...
        </p>
        <style>{`
          @keyframes spin-animation { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }
        `}</style>
      </div>
    );
  }

  // -------------------------------------------------------
  // RENDER: ASOSIY KONTENT
  // -------------------------------------------------------
  return (
    <div style={{ 
      padding: "24px", 
      maxWidth: "480px", 
      margin: "50px auto", 
      fontFamily: "Inter, -apple-system, sans-serif" 
    }}>
      <div style={{ 
        backgroundColor: "#ffffff", 
        padding: "40px 32px", 
        borderRadius: "20px", 
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        textAlign: "center"
      }}>
        
        {/* HOLAT 1: KUTILMOQDA (PENDING) */}
        {status === "pending" && (
          <div>
            <div style={{ fontSize: "70px", marginBottom: "24px" }}>⏳</div>
            <h2 style={{ margin: "0 0 16px 0", color: "#1a1a1a", fontSize: "22px" }}>
              Arizangiz ko'rib chiqilmoqda
            </h2>
            <p style={{ color: "#595959", lineHeight: "1.6", fontSize: "15px" }}>
              Siz yuborgan ma'lumotlar hozirda administratorlarimiz tomonidan tekshirilmoqda. 
              Bu jarayon odatda 24 soat ichida yakunlanadi.
            </p>
            <div style={{ marginTop: "32px" }}>
              <button 
                onClick={handleReturnToClient}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#1677ff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "16px",
                  transition: "all 0.2s"
                }}
              >
                Yo'lovchi rejimiga o'tish
              </button>
              <button 
                onClick={fetchDriverStatus}
                disabled={checking}
                style={{
                  marginTop: "16px",
                  display: "block",
                  width: "100%",
                  background: "none",
                  border: "none",
                  color: "#8c8c8c",
                  textDecoration: "underline",
                  cursor: checking ? "not-allowed" : "pointer",
                  fontSize: "14px"
                }}
              >
                {checking ? "Tekshirilmoqda..." : "Holatni yangilash"}
              </button>
            </div>
          </div>
        )}

        {/* HOLAT 2: TASDIQLANDI (APPROVED) */}
        {status === "approved" && (
          <div>
            <div style={{ fontSize: "70px", marginBottom: "24px" }}>✅</div>
            <h2 style={{ margin: "0 0 16px 0", color: "#52c41a", fontSize: "24px" }}>
              Tabriklaymiz!
            </h2>
            <p style={{ color: "#595959", lineHeight: "1.6" }}>
              Sizning haydovchilik arizangiz muvaffaqiyatli tasdiqlandi. Endi siz buyurtmalarni qabul qilishingiz mumkin.
            </p>
            <button
              onClick={handleGoToDashboard}
              style={{
                marginTop: "32px",
                width: "100%",
                padding: "16px",
                backgroundColor: "#52c41a",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "17px"
              }}
            >
              Ishni boshlash
            </button>
          </div>
        )}

        {/* HOLAT 3: RAD ETILDI (REJECTED) */}
        {status === "rejected" && (
          <div>
            <div style={{ fontSize: "70px", marginBottom: "24px" }}>❌</div>
            <h2 style={{ margin: "0 0 16px 0", color: "#f5222d", fontSize: "22px" }}>
              Arizangiz rad etildi
            </h2>
            <div style={{ 
              backgroundColor: "#fff1f0", 
              padding: "16px", 
              borderRadius: "12px", 
              color: "#cf1322",
              marginBottom: "24px",
              border: "1px solid #ffa39e",
              textAlign: "left",
              fontSize: "14px"
            }}>
              <strong>Sabab:</strong> {message}
            </div>
            <button
              onClick={handleRegister}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#fa8c16",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                marginBottom: "12px"
              }}
            >
              Ma'lumotlarni tahrirlash
            </button>
            <button 
              onClick={handleReturnToClient}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#f0f0f0",
                color: "#262626",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Yo'lovchi sifatida davom etish
            </button>
          </div>
        )}

        {/* HOLAT 4: ERROR / NONE */}
        {status === "none" && (
          <div>
            <div style={{ fontSize: "70px", marginBottom: "24px" }}>⚠️</div>
            <h2 style={{ margin: "0 0 16px 0", color: "#faad14", fontSize: "22px" }}>
              E'tibor bering
            </h2>
            <p style={{ color: "#595959", marginBottom: "32px" }}>{message}</p>
            <button
              onClick={handleRegister}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#1677ff",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                marginBottom: "12px"
              }}
            >
              Ro'yxatdan o'tish
            </button>
            <button 
              onClick={handleReturnToClient}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#f0f0f0",
                color: "#262626",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Asosiy sahifaga qaytish
            </button>
          </div>
        )}
      </div>
      
      <div style={{ textAlign: "center", marginTop: "40px", color: "#bfbfbf", fontSize: "12px" }}>
        Versiya 1.0.2 • Tizim barqaror ishlamoqda
      </div>
    </div>
  );
}