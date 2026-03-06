/**
 * DriverPending.jsx - FIXED VERSION
 * 
 * Changes:
 * ✅ Use useAppMode() context instead of localStorage
 * ✅ Removed hardcoded localStorage.setItem("app_mode", "client")
 * ✅ Now uses setAppMode from context
 * 
 * INSTALLATION:
 * Replace: src/pages/DriverPending.jsx
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSessionProfile } from "@shared/auth/useSessionProfile";
import { useAppMode } from "@/providers/AppModeProvider"; // ✅ ADD THIS

export default function DriverPending() {
  const navigate = useNavigate();
  const { setAppMode } = useAppMode(); // ✅ GET FROM CONTEXT
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending"); // pending | approved | rejected | none
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  const { loading: authLoading, user } = useSessionProfile({ includeDriver: true, includeApplication: true });

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

      // 2) Driver row
      const { data: drvRow, error: drvErr } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (drvErr) {
        console.error("drivers select error:", drvErr);
      }

      // 3) Check driver application
      const { data: appRow, error: appErr } = await supabase
        .from("driver_applications")
        .select("id, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (appErr) {
        console.error("driver_applications select error:", appErr);
      }

      // Derive approval
      let isDriverApproved = false;
      if (drvRow) {
        if (typeof drvRow.approved === "boolean") {
          isDriverApproved = drvRow.approved;
        } else if (typeof drvRow.status === "string") {
          const s = drvRow.status.trim().toLowerCase();
          isDriverApproved = [
            "approved",
            "active",
            "verified",
            "enabled",
            "ok",
          ].includes(s);
        } else {
          isDriverApproved = true;
        }
      }

      const appStatus =
        typeof appRow?.status === "string"
          ? appRow.status.trim().toLowerCase()
          : null;

      // Decide final status
      const isApproved = appStatus === "approved" || isDriverApproved;
      const isRejected = appStatus === "rejected";

      if (isApproved) {
        setStatus("approved");
        setLoading(false);
        setChecking(false);
        navigate("/driver/dashboard", { replace: true });
        return;
      }

      if (isRejected) {
        setStatus("rejected");
        setMessage("Arizangiz rad etilgan. Qayta ro'yxatdan o'ting.");
        setLoading(false);
        setChecking(false);
        return;
      }

      if (!appRow) {
        setStatus("none");
        setMessage("Siz hali haydovchi arizasini yubormagansiz.");
        setLoading(false);
        setChecking(false);
        return;
      }

      setStatus("pending");
      setMessage("");
      setLoading(false);
      setChecking(false);
    } catch (e) {
      console.error("DriverPending error:", e);
      setMessage("Xatolik yuz berdi. Keyinroq qayta urinib ko'ring.");
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchDriverStatus();
    const interval = setInterval(fetchDriverStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
          color: "#111827",
        }}
      >
        <div style={{ color: "#111827" }}>Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "#f9fafb",
        color: "#111827",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#111827",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          color: "#f9fafb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <h2 style={{ margin: 0, fontSize: 18, letterSpacing: 0.2 }}>
            HAYDOVCHI TASDIQLANMAGAN
          </h2>
        </div>

        <p style={{ marginTop: 8, marginBottom: 14, opacity: 0.9, lineHeight: 1.35 }}>
          Sizning haydovchi profilingiz tekshiruvda. Tasdiqlangandan keyin haydovchi rejimga
          avtomatik kirish amalga oshadi.
        </p>

        {message ? (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              padding: 10,
              borderRadius: 12,
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            {message}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 10 }}>
          <button
            onClick={fetchDriverStatus}
            style={{
              height: 42,
              borderRadius: 12,
              border: "none",
              background: "#374151",
              color: "#f9fafb",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            QAYTA TEKSHIR
          </button>

          {/* ✅ FIXED: Use context instead of localStorage */}
          <button
            onClick={() => {
              setAppMode("client"); // ✅ USE CONTEXT
              navigate("/client/home", { replace: true });
            }}
            style={{
              height: 42,
              borderRadius: 12,
              border: "none",
              background: "#e5e7eb",
              color: "#f9fafb",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            YO'LOVCHI REJIMGA QAYTISH
          </button>

          {status === "none" ? (
            <button
              onClick={() => navigate("/driver/register", { replace: true })}
              style={{
                height: 42,
                borderRadius: 12,
                border: "none",
                background: "#60a5fa",
                color: "#0b1220",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              HAYDOVCHI ARIZASINI YUBORISH
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
