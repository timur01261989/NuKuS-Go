import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

/**
 * DriverPending
 *
 * Project policy:
 * - Pending page is shown when a user intentionally enters driver mode but is not yet approved.
 * - Approval source of truth in THIS schema is driver_applications.status ('approved').
 * - `drivers` table in this project stores live driver location/online data and may or may not have an approval field.
 *
 * Therefore:
 * - If driver_applications.status === 'approved' -> go to /driver/dashboard (even if drivers row is missing).
 * - If rejected -> show message and allow re-register.
 * - If pending -> show pending UI.
 */
export default function DriverPending() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const [status, setStatus] = useState("pending"); // pending | approved | rejected | none
  const [message, setMessage] = useState("");

  const resetToClient = () => {
    try {
      localStorage.setItem("app_mode", "client");
    } catch {}
    navigate("/client/home", { replace: true });
  };

  const fetchStatus = async () => {
    if (checking) return;
    setChecking(true);

    try {
      // 1) get user id
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        console.error("auth getUser error:", authErr);
      }
      const userId = authData?.user?.id;

      if (!userId) {
        setStatus("none");
        setMessage("Login qiling.");
        setLoading(false);
        setChecking(false);
        return;
      }

      // 2) read latest application status (SOURCE OF TRUTH)
      const { data: appRow, error: appErr } = await supabase
        .from("driver_applications")
        .select("id, status, created_at, updated_at, reviewed_at, rejection_reason")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (appErr) {
        console.error("driver_applications select error:", appErr);
      }

      const appStatus = String(appRow?.status || "pending").trim().toLowerCase();

      // 3) approved -> go dashboard immediately
      if (appStatus === "approved") {
        setStatus("approved");
        setLoading(false);
        setChecking(false);
        navigate("/driver/dashboard", { replace: true });
        return;
      }

      // 4) rejected -> show message
      if (appStatus === "rejected") {
        setStatus("rejected");
        setMessage(appRow?.rejection_reason || "Arizangiz rad etilgan. Qayta ro‘yxatdan o‘ting.");
        setLoading(false);
        setChecking(false);
        return;
      }

      // 5) pending / submitted / review -> pending UI
      setStatus("pending");
      setMessage("Arizangiz ko‘rib chiqilmoqda. Tasdiqlangandan keyin haydovchi rejimiga avtomatik kirasiz.");
      setLoading(false);
      setChecking(false);
    } catch (e) {
      console.error("DriverPending fetchStatus error:", e);
      setStatus("pending");
      setMessage("Xatolik yuz berdi. Qayta urinib ko‘ring.");
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Visible loading UI (avoid white-on-white)
  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 420,
            maxWidth: "92vw",
            borderRadius: 16,
            padding: 18,
            background: "#111827",
            color: "#f9fafb",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>⏳ Tekshirilmoqda...</div>
          <div style={{ opacity: 0.9, fontSize: 13 }}>Iltimos, bir oz kuting.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: 520,
          maxWidth: "92vw",
          borderRadius: 16,
          padding: 18,
          background: "#111827",
          color: "#f9fafb",
          boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {status === "rejected" ? "HAYDOVCHI RAD ETILGAN" : "HAYDOVCHI TASDIQLANMAGAN"}
          </div>
        </div>

        <div style={{ fontSize: 13, opacity: 0.92, lineHeight: 1.35, marginBottom: 12 }}>
          {message ||
            "Sizning haydovchi profilingiz tekshirilmoqda. Tasdiqlangandan keyin haydovchi rejimiga avtomatik kirish amalga oshadi."}
        </div>

        <button
          onClick={fetchStatus}
          disabled={checking}
          style={{
            width: "100%",
            height: 42,
            borderRadius: 12,
            border: "none",
            cursor: checking ? "not-allowed" : "pointer",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: 800,
            letterSpacing: 0.3,
            marginBottom: 10,
            opacity: checking ? 0.7 : 1,
          }}
        >
          {checking ? "TEKSHIRILMOQDA..." : "QAYTA TEKSHIR"}
        </button>

        <button
          onClick={resetToClient}
          style={{
            width: "100%",
            height: 42,
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: "#e5e7eb",
            color: "#111827",
            fontWeight: 800,
          }}
        >
          YO‘LOVCHI REJIMGA QAYTISH
        </button>

        {status === "rejected" ? (
          <button
            onClick={() => navigate("/driver/register", { replace: true })}
            style={{
              width: "100%",
              height: 42,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: "#60a5fa",
              color: "#0b1220",
              fontWeight: 800,
              marginTop: 10,
            }}
          >
            QAYTA RO‘YXATDAN O‘TISH
          </button>
        ) : null}
      </div>
    </div>
  );
}
