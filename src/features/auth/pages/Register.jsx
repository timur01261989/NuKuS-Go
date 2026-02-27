import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@shared/i18n/useLanguage";

function formatUzPhone(rawPhone) {
  let digits = String(rawPhone || "").replace(/\D/g, "");
  if (digits.length === 9) digits = "998" + digits;
  if (!digits.startsWith("998")) digits = "998" + digits;
  digits = digits.slice(0, 12);
  return "+" + digits;
}

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");

  useEffect(() => {
    // If already logged in, go home
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) navigate("/", { replace: true });
    };
    check();
  }, [navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (pass1 !== pass2) {
      message.error(t("passMismatch") || "Parollar mos kelmadi!");
      return;
    }

    setLoading(true);
    try {
      const formatted = formatUzPhone(phone);

      // Supabase phone signup requires SMS verification depending on settings.
      const { data, error } = await supabase.auth.signUp({
        phone: formatted,
        password: pass1,
        options: {
          data: { name, surname },
        },
      });
      if (error) throw error;

      // Go to SMS confirm screen if needed
      message.success(t("smsSent") || "SMS kod yuborildi!");
      navigate("/sms", { replace: true, state: { phone: formatted } });
    } catch (err) {
      message.error(err?.message || "Register error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
        <div className="mb-6">
          <div className="text-2xl font-extrabold tracking-tight">UniGo</div>
          <div className="text-sm text-gray-500">{t("createAccount") || "Hisob yaratish"}</div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">{t("name") || "Ism"}</label>
              <input
                className="mt-1 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">{t("surname") || "Familiya"}</label>
              <input
                className="mt-1 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">{t("enterPhone") || "Telefon raqamingizni kiriting"}</label>
            <input
              className="mt-1 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder={t("phonePlaceholder") || "90 123 45 67"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">{t("password") || "Parol"}</label>
            <input
              className="mt-1 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={pass1}
              onChange={(e) => setPass1(e.target.value)}
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">{t("confirmPassword") || "Parolni tasdiqlang"}</label>
            <input
              className="mt-1 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
              type="password"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-3 font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {loading ? "..." : (t("createAccount") || "Hisob yaratish")}
          </button>

          <div className="text-sm text-gray-600 text-center">
            {t("alreadyHave") || "Hisobingiz bormi?"}{" "}
            <button
              type="button"
              className="font-semibold text-gray-900 hover:underline"
              onClick={() => navigate("/login")}
            >
              {t("loginLink") || "Kirish"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full rounded-xl px-4 py-3 font-semibold border hover:bg-gray-50"
          >
            {t("back") || "Ortga"}
          </button>
        </form>
      </div>
    </div>
  );
}
