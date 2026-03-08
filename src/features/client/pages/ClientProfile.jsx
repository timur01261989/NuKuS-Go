import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/shared/i18n/useLanguage";

export default function ClientProfile() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (mounted) setUser(u?.user || null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const name =
    user?.user_metadata?.full_name || user?.user_metadata?.name || t.userLabel;
  const phone = user?.phone || "";
  const email = user?.email || "";

  return (
    <div className="min-h-screen bg-softBlue dark:bg-backgroundDark font-display text-slate-900 dark:text-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          className="neumorphic-dark px-3 py-2 rounded-xl text-primaryHome"
          onClick={() => navigate("/client/home")}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">{t.profile || "Profil"}</h1>
        <div className="w-10" />
      </div>

      <div className="neumorphic-dark rounded-2xl p-5">
        {loading ? (
          <div className="text-slate-400">…</div>
        ) : (
          <>
            <div className="text-2xl font-extrabold">{name}</div>
            <div className="mt-2 space-y-1 text-sm text-slate-300">
              {phone ? (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primaryHome">call</span>
                  <span>{phone}</span>
                </div>
              ) : null}
              {email ? (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primaryHome">mail</span>
                  <span>{email}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                className="w-full neumorphic-inset-dark py-3 rounded-xl text-slate-200 font-semibold active:scale-95"
                onClick={() => navigate("/settings")}
              >
                {t.settings || "Sozlamalar"}
              </button>
              <button
                type="button"
                className="w-full neumorphic-inset-dark py-3 rounded-xl text-slate-200 font-semibold active:scale-95"
                onClick={() => navigate("/support")}
              >
                {t.support || "Yordam"}
              </button>
              <button
                type="button"
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl active:scale-95"
                onClick={signOut}
              >
                {t.logout || "Chiqish"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
