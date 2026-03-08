import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// MUHIM: shu import yo'lini sizdagi loyihaga moslang
import { supabase } from "../../../lib/supabaseClient";

const TRANSPORT_OPTIONS = [
  { value: "light_car", label: "Engil mashina" },
  { value: "bus_gazel", label: "Avtobus / Gazel" },
  { value: "truck", label: "Yuk tashish mashinasi" },
];

const initialForm = {
  first_name: "",
  last_name: "",
  phone: "",
  transport_type: "light_car",
  seat_count: "4",
  max_load_kg: "100",
  cargo_volume_m3: "",
  car_model: "",
  car_number: "",
  car_year: "",
  car_color: "",
  license_number: "",
  passport_number: "",
  notes: "",
};

function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("998")) return digits;
  return 998${digits};
}

function safeNumber(value, fallback = null) {
  if (value === ""  value === null  value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function DriverRegister() {
  const navigate = useNavigate();

  const [bootLoading, setBootLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fatalError, setFatalError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [driverApplication, setDriverApplication] = useState(null);
  const [driverRow, setDriverRow] = useState(null);

  const [form, setForm] = useState(initialForm);

  const isApprovedDriver = useMemo(() => {
    if (!driverRow) return false;
    return driverRow.is_verified === true || driverRow.approved === true;
  }, [driverRow]);

  const applicationStatus = useMemo(() => {
    return driverApplication?.status || null;
  }, [driverApplication]);

  useEffect(() => {
    let alive = true;

    async function bootstrap() {
      try {
        setBootLoading(true);
        setFatalError("");
        setInfoMessage("");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = session?.user || null;

        if (!alive) return;
        setSessionUser(user);

        if (!user?.id) {
          navigate("/login", { replace: true });
          return;
        }

        const [profileRes, appRes, driverRes] = await Promise.all([
          supabase
            .from("profiles")
            .select('*')
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("driver_applications")
            .select("*")
            .eq("user_id", user.id)
            .order("submitted_at", { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("drivers")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (profileRes.error) throw profileRes.error;
        if (appRes.error) throw appRes.error;
        if (driverRes.error) throw driverRes.error;

        if (!alive) return;

        const profileRow = profileRes.data || null;
        const appRow = appRes.data || null;
        const drvRow = driverRes.data || null;

        setProfile(profileRow);
        setDriverApplication(appRow);
        setDriverRow(drvRow);

        if (drvRow && (drvRow.is_verified === true || drvRow.approved === true)) {
          navigate("/app/driver/dashboard", { replace: true });
          return;
        }

        if (appRow?.status === "pending") {
          navigate("/app/driver/pending", { replace: true });
          return;
        }
// rejected bo'lsa formni qayta to'ldirishga ruxsat
        // approved bo'lsa drivers row bo'lishi kerak, lekin himoya sifatida:
        if (appRow?.status === "approved") {
          navigate("/app/driver/dashboard", { replace: true });
          return;
        }

        setForm((prev) => ({
          ...prev,
          first_name:
            profileRow?.first_name ||
            (profileRow?.full_name ? String(profileRow.full_name).split(" ")[0] : "") ||
            prev.first_name,
          last_name:
            profileRow?.last_name ||
            (profileRow?.full_name
              ? String(profileRow.full_name).split(" ").slice(1).join(" ")
              : "") ||
            prev.last_name,
          phone: profileRow?.phone  user?.phone  prev.phone,
        }));
      } catch (err) {
        console.error("DriverRegister bootstrap error:", err);
        if (!alive) return;
        setFatalError(err?.message || "Sahifani yuklashda xatolik yuz berdi.");
      } finally {
        if (alive) setBootLoading(false);
      }
    }

    bootstrap();

    return () => {
      alive = false;
    };
  }, [navigate]);

  useEffect(() => {
    // transport turiga qarab defaultlar
    setForm((prev) => {
      if (prev.transport_type === "light_car") {
        return {
          ...prev,
          seat_count: prev.seat_count || "4",
          max_load_kg: prev.max_load_kg || "100",
        };
      }

      if (prev.transport_type === "bus_gazel") {
        return {
          ...prev,
          seat_count: prev.seat_count || "12",
          max_load_kg: prev.max_load_kg || "500",
        };
      }

      if (prev.transport_type === "truck") {
        return {
          ...prev,
          seat_count: "1",
          max_load_kg: prev.max_load_kg || "3000",
        };
      }

      return prev;
    });
  }, [form.transport_type]);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validateForm() {
    const errors = [];

    if (!form.first_name.trim()) errors.push("Ism majburiy.");
    if (!form.last_name.trim()) errors.push("Familiya majburiy.");
    if (!form.transport_type) errors.push("Transport turi majburiy.");
    if (!form.car_model.trim()) errors.push("Mashina modeli majburiy.");
    if (!form.car_number.trim()) errors.push("Mashina raqami majburiy.");

    const normalizedPhone = normalizePhone(form.phone  profile?.phone  sessionUser?.phone);
    if (!normalizedPhone) errors.push("Telefon raqam majburiy.");

    const carYear = safeNumber(form.car_year);
    if (carYear !== null && (carYear < 1950 || carYear > 2100)) {
      errors.push("Mashina yili noto‘g‘ri.");
    }

    const seatCount = safeNumber(form.seat_count);
    if (seatCount !== null && seatCount < 1) {
      errors.push("O‘rindiq soni noto‘g‘ri.");
    }

    const maxLoadKg = safeNumber(form.max_load_kg);
    if (maxLoadKg !== null && maxLoadKg < 0) {
      errors.push("Yuk sig‘imi noto‘g‘ri.");
    }

    return errors;
  }

  async function ensureProfileExists(userId) {
    const normalizedPhone = normalizePhone(form.phone  profile?.phone  sessionUser?.phone);
    const fullName = ${form.first_name} ${form.last_name}.trim();

    const payload = {
      id: userId,
      phone: normalizedPhone || null,
      full_name: fullName || null,
      first_name: form.first_name.trim() || null,
      last_name: form.last_name.trim() || null,
      "role": profile?.role || "client",
      "current_role": profile?.current_role || "client",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload, {
      onConflict: "id",
    });

    if (error) throw error;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSubmitError("");
      setInfoMessage("");

      if (!sessionUser?.id) {
        setSubmitError("Sessiya topilmadi. Qayta login qiling.");
        return;
      }
      const errors = validateForm();
      if (errors.length) {
        setSubmitError(errors.join(" "));
        return;
      }

      setSubmitting(true);

      await ensureProfileExists(sessionUser.id);

      const normalizedPhone = normalizePhone(form.phone  profile?.phone  sessionUser?.phone);
      const fullName = ${form.first_name} ${form.last_name}.trim();

      const applicationPayload = {
        user_id: sessionUser.id,
        status: "pending",
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        full_name: fullName,
        phone: normalizedPhone || null,

        transport_type: form.transport_type,

        seat_count: safeNumber(form.seat_count),
        max_load_kg: safeNumber(form.max_load_kg),
        cargo_volume_m3: safeNumber(form.cargo_volume_m3),

        car_model: form.car_model.trim() || null,
        car_number: form.car_number.trim() || null,
        car_year: safeNumber(form.car_year),
        car_color: form.car_color.trim() || null,

        license_number: form.license_number.trim() || null,
        passport_number: form.passport_number.trim() || null,
        notes: form.notes.trim() || null,

        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        documents: {
          source: "driver_register_web",
        },
      };

      // pending ariza bo'lsa update, bo'lmasa create
      if (driverApplication?.id) {
        applicationPayload.id = driverApplication.id;
      }

      const { error: appError } = await supabase
        .from("driver_applications")
        .upsert(applicationPayload, {
          onConflict: driverApplication?.id ? "id" : "user_id",
        });

      if (appError) throw appError;

      setInfoMessage("Arizangiz yuborildi.");
      navigate("/app/driver/pending", { replace: true });
    } catch (err) {
      console.error("DriverRegister submit error:", err);
      setSubmitError(err?.message || "Arizani yuborishda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (bootLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.title}>Haydovchi ro‘yxatdan o‘tish</h2>
          <p style={styles.muted}>Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (fatalError) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.title}>Xatolik</h2>
          <p style={styles.error}>{fatalError}</p>
          <button style={styles.button} onClick={() => window.location.reload()}>
            Qayta yuklash
          </button>
        </div>
      </div>
    );
  }

  if (isApprovedDriver) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.title}>Siz allaqachon tasdiqlangansiz</h2>
          <button style={styles.button} onClick={() => navigate("/app/driver/dashboard", { replace: true })}>
            Dashboard ga o‘tish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Haydovchi bo‘lish</h1>
        <p style={styles.muted}>
          Ma’lumotlarni to‘ldiring. Arizangiz ko‘rib chiqilgandan keyin driver rejimi ochiladi.
        </p>

        {applicationStatus === "rejected" && (
          <div style={styles.warning}>
            Arizangiz rad etilgan. Tuzatib qayta yuborishingiz mumkin.
            {driverApplication?.rejection_reason ? (
              <div style={{ marginTop: 8 }}>
                Sabab: <strong>{driverApplication.rejection_reason}</strong>
              </div>
            ) : null}
          </div>
        )}

        {submitError ? <div style={styles.errorBox}>{submitError}</div> : null}
        {infoMessage ? <div style={styles.successBox}>{infoMessage}</div> : null}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Ism</label>
              <input
                style={styles.input}
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
                placeholder="Ism"
              />
            </div>

            <div>
              <label style={styles.label}>Familiya</label>
              <input
                style={styles.input}
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                placeholder="Familiya"
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Telefon</label>
            <input
              style={styles.input}
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="998901234567"
            />
          </div>

          <div>
            <label style={styles.label}>Transport turi</label>
            <select
              style={styles.input}
              value={form.transport_type}
              onChange={(e) => setField("transport_type", e.target.value)}
            >
              {TRANSPORT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Mashina modeli</label>
              <input
                style={styles.input}
                value={form.car_model}
                onChange={(e) => setField("car_model", e.target.value)}
                placeholder="Cobalt, Damas, Gazel..."
              />
            </div>

            <div>
              <label style={styles.label}>Mashina raqami</label>
              <input
                style={styles.input}
                value={form.car_number}
                onChange={(e) => setField("car_number", e.target.value)}
                placeholder="01A123BC"
              />
            </div>
          </div>

          <div style={styles.grid3}>
            <div>
              <label style={styles.label}>Mashina yili</label>
              <input
                style={styles.input}
                value={form.car_year}
                onChange={(e) => setField("car_year", e.target.value)}
                placeholder="2020"
              />
            </div>

            <div>
              <label style={styles.label}>Mashina rangi</label>
              <input
                style={styles.input}
                value={form.car_color}
                onChange={(e) => setField("car_color", e.target.value)}
                placeholder="Oq"
              />
            </div>

            <div>
              <label style={styles.label}>O‘rindiq soni</label>
              <input
                style={styles.input}
                value={form.seat_count}
                onChange={(e) => setField("seat_count", e.target.value)}
                placeholder="4"
              />
            </div>
          </div>

          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Maks. yuk sig‘imi (kg)</label>
              <input
                style={styles.input}
                value={form.max_load_kg}
                onChange={(e) => setField("max_load_kg", e.target.value)}
                placeholder="100"
              />
            </div>

            <div>
              <label style={styles.label}>Yuk hajmi (m³)</label>
              <input
                style={styles.input}
                value={form.cargo_volume_m3}
                onChange={(e) => setField("cargo_volume_m3", e.target.value)}
                placeholder="1.5"
              />
            </div>
          </div>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Haydovchilik guvohnomasi raqami</label>
              <input
                style={styles.input}
                value={form.license_number}
                onChange={(e) => setField("license_number", e.target.value)}
                placeholder="AB1234567"
              />
            </div>

            <div>
              <label style={styles.label}>Pasport / ID raqami</label>
              <input
                style={styles.input}
                value={form.passport_number}
                onChange={(e) => setField("passport_number", e.target.value)}
                placeholder="AA1234567"
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Izoh</label>
            <textarea
              style={{ ...styles.input, minHeight: 100, resize: "vertical" }}
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Qo‘shimcha ma’lumot"
            />
          </div>

          <button type="submit" style={styles.button} disabled={submitting}>
            {submitting ? "Yuborilmoqda..." : "Ariza yuborish"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 860,
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  title: {
    margin: 0,
    marginBottom: 8,
    fontSize: 28,
    fontWeight: 700,
    color: "#111827",
  },
  muted: {
    margin: 0,
    marginBottom: 20,
    color: "#6b7280",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 16,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    color: "#111827",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    border: "none",
    borderRadius: 12,
    background: "#111827",
    color: "#fff",
    padding: "14px 16px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    color: "#b91c1c",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 12,
    padding: 12,
  },
  successBox: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
    borderRadius: 12,
    padding: 12,
  },
  warning: {
    background: "#fffbeb",
    color: "#92400e",
    border: "1px solid #fde68a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
};