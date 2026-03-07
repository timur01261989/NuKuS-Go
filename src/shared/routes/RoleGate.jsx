/**
 * RoleGate.jsx - TO'LIQ VA TO'G'IRLANGAN VERSIYA
 * -------------------------------------------------------
 * Location: src/shared/routes/RoleGate.jsx
 * FIX: useAppMode kontekstidan foydalanish va import xatolarini tuzatish.
 * Hech qanday qisqartirishlarsiz.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { supabase } from "@/lib/supabase";
import { useAppMode } from "@/providers/AppModeProvider"; // ✅ To'g'ri import

/**
 * pickHomeForRole - Rol va rejimga qarab yo'naltirish manzillarini aniqlaydi.
 * @param {Object} params - role, driverRow, driverApplication, appMode
 */
export function pickHomeForRole({ role, driverRow, driverApplication, appMode }) {
  const r = (role || "client").toLowerCase();
  const mode = (appMode || "client").toLowerCase(); 

  // 1. Admin har doim admin panelga
  if (r === "admin") return "/admin";

  // 2. Agar ilova rejimi "driver" (haydovchi) bo'lmasa, mijoz asosiy sahifasiga
  if (mode !== "driver") return "/client/home";

  // 3. Haydovchi roli va rejimi uchun tekshiruvlar
  if (r === "driver") {
    const appStatus = (driverApplication?.status || "").toLowerCase();

    // Haydovchi tasdiqlanganini turli ustunlar orqali tekshirish
    const driverApproved =
      !!driverRow &&
      (String(driverRow.status || "").toLowerCase() === "approved" ||
        String(driverRow.status || "").toLowerCase() === "active" ||
        driverRow.is_approved === true ||
        driverRow.approved === true);

    if (driverApproved) return "/driver/dashboard";
    
    // Arizalar holatiga qarab yo'naltirish
    if (appStatus === "approved") return "/driver/dashboard";
    if (appStatus === "pending") return "/driver/pending";
    if (appStatus === "rejected") return "/driver/pending";

    // Agar hech qanday ma'lumot bo'lmasa, ro'yxatdan o'tishga
    return "/driver/register";
  }

  // Standart holatda mijoz sahifasi
  return "/client/home";
}

/**
 * RoleGate - Sahifalarga kirish huquqini boshqaruvchi asosiy komponent.
 */
export default function RoleGate({ children, allow, redirectTo = "/login" }) {
  const location = useLocation();
  const { appMode } = useAppMode(); // ✅ Kontekstdan joriy rejimni olish
  
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [driverRow, setDriverRow] = useState(null);
  const [driverApplication, setDriverApplication] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Foydalanuvchi ma'lumotlarini yuklash funksiyasi
    const initGate = async () => {
      try {
        setLoading(true);
        
        // 1. Joriy foydalanuvchini olish
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) {
            setRole(null);
            setLoading(false);
          }
          return;
        }

        // 2. Parallel ravishda profil, haydovchi ma'lumotlari va arizasini yuklash
        const [profileRes, driverRes, appRes] = await Promise.all([
          supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
          supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("driver_applications").select("*").eq("user_id", user.id).maybeSingle()
        ]);

        if (!isMounted) return;

        // Ma'lumotlarni o'zgaruvchilarga saqlash (topilmasa null)
        const userRole = profileRes.data?.role || "client";
        const dRow = driverRes.data || null;
        const dApp = appRes.data || null;

        setRole(userRole);
        setDriverRow(dRow);
        setDriverApplication(dApp);
      } catch (err) {
        console.error("[RoleGate Error]:", err);
        if (isMounted) setRole(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initGate();

    return () => {
      isMounted = false;
    };
  }, []);

  // Ma'lumotlar yuklanayotgan vaqtda spinner ko'rsatish
  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        flexDirection: "column",
        gap: "10px"
      }}>
        <Spin size="large" />
        <span style={{ color: "#999" }}>Ruxsatlar tekshirilmoqda...</span>
      </div>
    );
  }

  // Foydalanuvchi tizimga kirmagan bo'lsa login sahifasiga yuborish
  if (!role) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Kirish huquqini tekshirish (useMemo optimizatsiya uchun)
  const hasAccess = useMemo(() => {
    const currentRole = role.toLowerCase();

    if (allow?.admin && currentRole === "admin") return true;
    if (allow?.driver && currentRole === "driver") return true;
    if (allow?.client && currentRole === "client") return true;

    return false;
  }, [role, allow]);

  // Agar kirish taqiqlangan bo'lsa, mos keladigan sahifani aniqlash
  if (!hasAccess) {
    const destination = pickHomeForRole({
      role,
      driverRow,
      driverApplication,
      appMode
    });

    // Cheksiz yo'naltirish (infinite loop) bo'lmasligi uchun tekshiruv
    if (location.pathname === destination) {
      return children;
    }

    return <Navigate to={destination} replace />;
  }

  // Hamma narsa joyida bo'lsa, sahifani ko'rsatish
  return children;
}