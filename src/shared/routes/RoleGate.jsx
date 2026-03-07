/**
 * RoleGate.jsx - TO'LIQ VA TO'G'IRLANGAN VERSIYA
 * * Location: src/shared/routes/RoleGate.jsx
 * * FIX: useAppMode kontekstidan appMode qiymatini olish va 
 * yo'naltirish (redirect) mantiqini to'liq ishlashini ta'minlash.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@/lib/supabase";
import { useAppMode } from "@/providers/AppModeProvider"; // ✅ KONTEKST IMPORTI

/**
 * pickHomeForRole - Rol va rejimga qarab mos sahifani aniqlash
 * Bu funksiya komponentdan tashqarida ham ishlatilishi mumkinligi uchun eksport qilingan.
 */
export function pickHomeForRole({ role, driverRow, driverApplication, appMode }) {
  const r = (role || "client").toLowerCase();
  const mode = (appMode || "client").toLowerCase(); 

  // 1. Agar admin bo'lsa, har doim admin panelga
  if (r === "admin") return "/admin";

  // 2. Agar ilova rejimi "driver" bo'lmasa, har doim mijoz asosiy sahifasiga
  if (mode !== "driver") return "/client/home";

  // 3. Agar haydovchi rejimida bo'lsa
  if (r === "driver") {
    const appStatus = (driverApplication?.status || "").toLowerCase();

    // Haydovchi tasdiqlanganini tekshirish (turli xil baza variantlari uchun)
    const driverApproved =
      !!driverRow &&
      (String(driverRow.status || "").toLowerCase() === "approved" ||
        String(driverRow.status || "").toLowerCase() === "active" ||
        driverRow.is_approved === true ||
        driverRow.approved === true);

    if (driverApproved) return "/driver/dashboard";
    
    // Agar ariza tasdiqlangan bo'lsa-yu, hali haydovchi jadvalida faol bo'lmasa
    if (appStatus === "approved") return "/driver/dashboard";
    
    // Agar ariza kutilayotgan bo'lsa
    if (appStatus === "pending") return "/driver/pending";
    
    // Agar ariza rad etilgan bo'lsa
    if (appStatus === "rejected") return "/driver/pending";

    // Aks holda ro'yxatdan o'tishga
    return "/driver/register";
  }

  // Boshqa barcha holatlarda mijoz sahifasiga
  return "/client/home";
}

/**
 * RoleGate - Asosiy komponent
 * Berilgan 'allow' qoidalariga ko'ra kirishni cheklaydi yoki yo'naltiradi.
 */
export default function RoleGate({ children, allow, redirectTo = "/login" }) {
  const location = useLocation();
  const { appMode } = useAppMode(); // ✅ KONTEKSTDAN JORIY REJIMNI OLISH
  
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [driverRow, setDriverRow] = useState(null);
  const [driverApplication, setDriverApplication] = useState(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        
        // 1. Auth foydalanuvchini olish
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user) {
          if (isMounted) {
            setRole(null);
            setLoading(false);
          }
          return;
        }

        // 2. Profil, Haydovchi va Ariza ma'lumotlarini parallel yuklash
        const [profileRes, driverRes, appRes] = await Promise.all([
          supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
          supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("driver_applications").select("*").eq("user_id", user.id).maybeSingle()
        ]);

        if (!isMounted) return;

        // Xatoliklarni tekshirish (PGRST116 - ma'lumot topilmagan holat, bu xato emas)
        const profileRole = profileRes.data?.role || "client";
        const driver = driverRes.error?.code === "PGRST116" ? null : driverRes.data;
        const app = appRes.error?.code === "PGRST116" ? null : appRes.data;

        setRole(profileRole);
        setDriverRow(driver);
        setDriverApplication(app);
      } catch (err) {
        console.error("[RoleGate] Fetch error:", err);
        if (isMounted) setRole(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Yuklanish jarayoni
  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#f0f2f5"
      }}>
        <Spin size="large" tip="Sahifa yuklanmoqda..." />
      </div>
    );
  }

  // Agar foydalanuvchi tizimga kirmagan bo'lsa (yoki roli yo'q bo'lsa), login sahifasiga
  if (!role) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Foydalanuvchi kirish huquqiga egaligini tekshirish
  const hasAccess = useMemo(() => {
    const userRole = role.toLowerCase();

    // Ruxsat berilgan rollarni tekshirish
    if (allow?.admin && userRole === "admin") return true;
    if (allow?.driver && userRole === "driver") return true;
    if (allow?.client && userRole === "client") return true;

    return false;
  }, [role, allow]);

  // Agar kirishga ruxsat bo'lmasa, foydalanuvchini o'z rolidan kelib chiqib mos sahifaga yuborish
  if (!hasAccess) {
    const nextRoute = pickHomeForRole({
      role,
      driverRow,
      driverApplication,
      appMode // ✅ useAppMode dan kelgan qiymat uzatiladi
    });

    // Hozirgi joylashuv va yo'naltirilayotgan joy bir xil bo'lsa, cheksiz sikl oldini olish
    if (location.pathname === nextRoute) {
      return children; 
    }

    return <Navigate to={nextRoute} replace />;
  }

  // Agar hamma tekshiruvlardan o'tsa, sahifani ko'rsatish
  return children;
}