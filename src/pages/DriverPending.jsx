import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function DriverPending() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending"); // pending | approved | rejected | none
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  const fetchDriverStatus = async () => {
    if (checking) return;
    setChecking(true);

    try {
      setMessage("");

      // 1) Auth user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Auth error:", authError);
      }
      const user = authData?.user;

      if (!user) {
        setLoading(false);
        setChecking(false);
        navigate("/login", { replace: true });
        return;
      }

      // 2) If profile role is already driver, we can treat as approved
      //    (this is the most reliable "final state" for route guards)
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr) {
        console.error("Profile select error:", profileErr);
      }

      // 3) Check latest driver application status
      //    (driver_applications row is created when user submits registration)
      const { data: appRow, error: appErr } = await supabase
        .from("driver_applications")
        .select("id, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (appErr) {
        console.error("driver_applications select error:", appErr);
      }

      const role = profile?.role || null;
      const appStatus = appRow?.status || null;

      // Variant A (recommended): final driver access is based on:
      //  - profiles.role === 'driver'
      //  - a corresponding row exists in `drivers` table
      // The `driver_applications` table is ONLY the registration request (pending/rejected history).
      let driverRow = null;
      let driverRowExists = false;

      try {
        const { data: drv, error: drvErr } = await supabase
          .from("drivers")
          .select("id, user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (drvErr) {
          console.error("drivers select error:", drvErr);
        } else if (drv) {
          driverRow = drv;
          driverRowExists = true;
        }
      } catch (e) {
        console.error("drivers select exception:", e);
      }

      // Decide final status for this page
      // Approved ONLY if role is driver AND drivers row exists (Variant A)
      const isApproved = role === "driver" && driverRowExists;
      const isRejected = appStatus === "rejected";

      if (isApproved) {
        setStatus("approved");
        setLoading(false);
        setChecking(false);

        // Important: only redirect once we are sure approved,
        // and let RoleGate / dashboard routes see the updated profile role.
        navigate("/driver/dashboard", { replace: true });
        return;
      }

      // Defensive: if role already became 'driver' but drivers row is missing,
      // stay on pending with a clear message (prevents redirect loops).
      if (role === "driver" && !driverRowExists) {
        setStatus("pending");
        setMessage("Admin tasdiqlagan bo‘lishi mumkin, lekin haydovchi profili (drivers jadvali) topilmadi. Iltimos, birozdan so‘ng qayta tekshiring yoki admin bilan bog‘laning.");
        setLoading(false);
        setChecking(false);
        return;
      }

      if (isRejected) {
        setStatus("rejected");
        setMessage("Arizangiz rad etilgan. Qayta ro‘yxatdan o‘ting.");
        setLoading(false);
        setChecking(false);
        return;
      }

      if (!appRow) {
        // User has no application yet
        setStatus("none");
        setMessage("Siz hali haydovchi arizasini yubormagansiz.");
        setLoading(false);
        setChecking(false);
        return;
      }

      // Otherwise: still pending
      setStatus("pending");
      setMessage("");
      setLoading(false);
      setChecking(false);
    } catch (e) {
      console.error("DriverPending error:", e);
      setMessage("Xatolik yuz berdi. Keyinroq qayta urinib ko‘ring.");
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchDriverStatus();
    const interval = setInterval(fetchDriverStatus, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#fff" }}>Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#1f2937",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <h2 style={{ margin: 0, fontSize: 18, letterSpacing: 0.2 }}>HAYDOVCHI TASDIQLANMAGAN</h2>
        </div>

        <p style={{ marginTop: 8, marginBottom: 14, opacity: 0.9, lineHeight: 1.35 }}>
          Sizning haydovchi profilingiz tekshiruvda. Tasdiqlangandan keyin haydovchi rejimga avtomatik kirish amalga oshadi.
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
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            QAYTA TEKSHIR
          </button>

          <button
            onClick={() => navigate("/", { replace: true })}
            style={{
              height: 42,
              borderRadius: 12,
              border: "none",
              background: "#e5e7eb",
              color: "#111827",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            YO‘LOVCHI REJIMGA QAYTISH
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
