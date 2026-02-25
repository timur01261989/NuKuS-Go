import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

/*
  DriverPending (ORIGINAL STYLE + FIX)

  FIX:
  Approval source = driver_applications.status
  If status === 'approved' → redirect to /driver/dashboard
*/

export default function DriverPending() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState("pending");

  const resetToClient = () => {
    try {
      localStorage.setItem("app_mode", "client");
    } catch {}
    navigate("/client/home", { replace: true });
  };

  const checkStatus = async () => {
    if (checking) return;
    setChecking(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) {
        setLoading(false);
        setChecking(false);
        return;
      }

      const { data: app } = await supabase
        .from("driver_applications")
        .select("status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const appStatus = String(app?.status || "pending").toLowerCase();

      if (appStatus === "approved") {
        navigate("/driver/dashboard", { replace: true });
        return;
      }

      setStatus(appStatus);
      setLoading(false);
      setChecking(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 120 }}>
        <div>Tekshirilmoqda...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 120 }}>
      <div
        style={{
          width: 420,
          borderRadius: 14,
          padding: 20,
          background: "#1f2937",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <h3>⏳ Haydovchi tasdiqlanmagan</h3>
        <p>
          Sizning haydovchi profilingiz tekshirilmoqda. Tasdiqlangandan keyin
          avtomatik kirish amalga oshadi.
        </p>

        <button
          onClick={checkStatus}
          style={{
            width: "100%",
            height: 42,
            marginTop: 10,
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          QAYTA TEKSHIR
        </button>

        <button
          onClick={resetToClient}
          style={{
            width: "100%",
            height: 42,
            marginTop: 10,
            borderRadius: 10,
            border: "none",
            background: "#e5e7eb",
            color: "#111827",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          YO‘LOVCHI REJIMGA QAYTISH
        </button>
      </div>
    </div>
  );
}
