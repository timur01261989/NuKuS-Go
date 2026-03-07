/**
 * DriverPending.jsx - CORRECTED VERSION (NO XATO!)
 * 
 * Location: src/pages/DriverPending.jsx
 * 
 * FIX: Use useSessionProfile (from original) + useAppMode (context)
 * NOT useUserStore (doesn't exist!)
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSessionProfile } from "@shared/auth/useSessionProfile"; // ✅ CORRECT IMPORT
import { useAppMode } from "@/providers/AppModeProvider"; // ✅ CONTEXT

export default function DriverPending() {
  const navigate = useNavigate();
  const { setAppMode } = useAppMode(); // ✅ GET FROM CONTEXT
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending"); // pending | approved | rejected | none
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  const { loading: authLoading, user } = useSessionProfile({ 
    includeDriver: true, 
    includeApplication: true 
  }); // ✅ ORIGINAL HOOK

  const fetchDriverStatus = async () => {
    if (checking) return;
    setChecking(true);

    try {
      setMessage("");

      // 1) Auth user (prefer hook)
      const hookUser = user;
      let authUser = hookUser;
      if (!authUser) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) console.error("Auth error:", authError);
        authUser = authData?.user ?? null;
      }
      const userId = authUser?.id ?? null;
      if (!userId) {
        setStatus("none");
        setMessage("Login qiling.");
        setLoading(false);
        setChecking(false);
        return;
      }

      // 2) Check driver role
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        setMessage("Profil xatosi.");
        setStatus("none");
        setLoading(false);
        setChecking(false);
        return;
      }

      const role = profileData?.role?.toLowerCase() ?? "client";
      if (role !== "driver") {
        setStatus("none");
        setMessage("Siz haydovchi emasiz.");
        navigate("/client/home", { replace: true });
        return;
      }

      // 3) Check driver_applications table
      const { data: appData, error: appError } = await supabase
        .from("driver_applications")
        .select("status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (appError?.code === "PGRST116") {
        // No application found
        setStatus("none");
        setMessage("Ro'yxatdan o'tish uchun haydovchi formulasini to'ldiring.");
        navigate("/driver/register", { replace: true });
        return;
      }

      if (appError) {
        console.error("Application fetch error:", appError);
        setMessage("Xato: Rasmiylashtirish ma'lumotlari olib bo'lmadi.");
        setStatus("none");
        setLoading(false);
        setChecking(false);
        return;
      }

      const appStatus = appData?.status?.toLowerCase() ?? "unknown";

      if (appStatus === "approved") {
        setStatus("approved");
        setMessage("Siz haydovchi sifatida tasdiqlandi!");
        // Auto-navigate after 2 seconds
        setTimeout(() => {
          navigate("/driver/dashboard", { replace: true });
        }, 2000);
        return;
      }

      if (appStatus === "rejected") {
        setStatus("rejected");
        setMessage("Sizning rasmiylashtirish rad etildi. Sabab uchun admin bilan bog'laning.");
        return;
      }

      // pending | submitted | etc
      setStatus("pending");
      setMessage("Rasmiylashtirish tekshirilmoqda...");
    } catch (err) {
      console.error("DriverPending error:", err);
      setStatus("none");
      setMessage("Xatoli oqlash xatosi.");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  // On mount or when user changes
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    fetchDriverStatus();
  }, [user, authLoading, navigate]);

  const handleReturnToClient = () => {
    setAppMode("client"); // ✅ USE setAppMode
    navigate("/client/home", { replace: true });
  };

  const handleRegister = () => {
    navigate("/driver/register", { replace: true });
  };

  const handleCheckStatus = () => {
    fetchDriverStatus();
  };

  if (authLoading || loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        flexDirection: "column",
        gap: "10px"
      }}>
        <div style={{ 
          width: "40px", 
          height: "40px", 
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3498db",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <p>Yuklanmoqda...</p>
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
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      backgroundColor: "#f5f5f5"
    }}>
      <div style={{
        maxWidth: "500px",
        width: "100%",
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        {status === "approved" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
            <h2>Tasdiqlandi!</h2>
            <p>{message}</p>
            <p style={{ fontSize: "12px", color: "#999" }}>
              Dashboard'ga yo'nalatilmoqda...
            </p>
          </div>
        )}

        {status === "rejected" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>❌</div>
            <h2>Rad Etildi</h2>
            <p>{message}</p>
            <button 
              onClick={handleReturnToClient}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Orqaga Qaytish
            </button>
          </div>
        )}

        {status === "pending" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>⏳</div>
            <h2>Tekshirilmoqda</h2>
            <p>{message}</p>
            <button
              onClick={handleCheckStatus}
              style={{
                marginTop: "20px",
                marginRight: "10px",
                padding: "10px 20px",
                backgroundColor: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Holati Tekshirish
            </button>
            <button 
              onClick={handleReturnToClient}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: "#95a5a6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Yo'lovchi Rejimi
            </button>
          </div>
        )}

        {status === "none" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>❓</div>
            <h2>Xato</h2>
            <p>{message}</p>
            <button
              onClick={handleRegister}
              style={{
                marginTop: "20px",
                marginRight: "10px",
                padding: "10px 20px",
                backgroundColor: "#e74c3c",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Haydovchi Sifatida Ro'yxatdan O'tish
            </button>
            <button 
              onClick={handleReturnToClient}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: "#95a5a6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Yo'lovchi Rejimi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
