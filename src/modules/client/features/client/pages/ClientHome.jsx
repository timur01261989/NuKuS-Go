import React, { memo, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { prefetch } from "@/services/platform/prefetchService";
import { supabase } from "@/services/supabase/supabaseClient";
import { listMarketCars, formatPriceUZS } from "@services/marketService";
import { useLanguage } from "@/modules/shared/i18n/useLanguage.js";
import ClientSidebar from "../components/ClientSidebar";

/**
 * ClientHome.jsx — Mijoz boshqaruv paneli.
 * Production-ready: High-load traffikka moslashtirilgan.
 */
function ClientHome() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState({ 
    fullName: t?.passenger || "Yo‘lovchi", 
    avatarUrl: "" 
  });
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Xizmatlar ro'yxatini memoizatsiya qilish
  const services = useMemo(() => [
    { key: "intercity", icon: "south_america", labelKey: "interProv", fallback: "Viloyatlar aro", path: "/client/inter-provincial", prefetchKey: "intercity" },
    { key: "interdistrict", icon: "route", labelKey: "interDistrict", fallback: "Tumanlar aro", path: "/client/inter-district", prefetchKey: "interDistrict" },
    { key: "freight", icon: "local_shipping", labelKey: "freight", fallback: "Yuk tashish", path: "/client/freight", prefetchKey: "freight" },
    { key: "delivery", icon: "deployed_code_history", labelKey: "delivery", fallback: "Eltish xizmati", path: "/client/delivery", prefetchKey: "delivery" },
  ], []);

  // Profil ma'lumotlarini yuklash (Xavfsiz va optimallashgan)
  const fetchUserData = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      
      if (!user) return;

      // Faqat kerakli ustunlarni chaqirish orqali 400 xatosini oldini olamiz
      const { data: p, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url") 
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      setProfile({
        fullName: p?.full_name || user.user_metadata?.full_name || t?.userLabel || "Foydalanuvchi",
        avatarUrl: p?.avatar_url || user.user_metadata?.avatar_url || ""
      });
    } catch (err) {
      console.error("[ClientHome] Profile Fetch Error:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Avtomobillar ro'yxatini yuklash
  const fetchCars = useCallback(async () => {
    try {
      const list = await listMarketCars({ limit: 6 });
      setCars(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("[ClientHome] Cars Fetch Error:", err);
      setCars([]);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchCars();
  }, [fetchUserData, fetchCars]);

  const avatarFallback = useMemo(() => {
    const s = String(profile.fullName || "").trim();
    if (!s) return "U";
    return s.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "U";
  }, [profile.fullName]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  return (
    <div className="unigo-page pb-28 font-display text-slate-900 bg-slate-50/50 min-h-screen">
      <header className="unigo-topbar px-4 py-4 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <button type="button" className="flex items-center gap-3 text-left group" onClick={() => setSidebarOpen(true)}>
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-md ring-1 ring-slate-100 transition group-active:scale-95">
              {profile.avatarUrl ? (
                <img className="h-full w-full object-cover" alt="avatar" src={profile.avatarUrl} />
              ) : (
                <span className="text-sm font-black text-primaryHome">{avatarFallback}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assalomu alaykum</div>
              <div className="max-w-[150px] truncate text-sm font-black text-slate-900">{profile.fullName}</div>
            </div>
          </button>
          
          <div className="flex items-center gap-2">
            <button onClick={() => handleNavigate('/settings')} className="unigo-soft-card flex h-11 w-11 items-center justify-center p-0 hover:bg-white active:scale-90 transition shadow-sm">
              <span className="material-symbols-outlined text-slate-600 text-[22px]" data-no-auto-translate="true">settings</span>
            </button>
            <button className="unigo-soft-card flex h-11 w-11 items-center justify-center p-0 hover:bg-white active:scale-90 transition shadow-sm">
              <span className="material-symbols-outlined text-slate-600 text-[22px]" data-no-auto-translate="true">notifications</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-5">
        {/* Asosiy Banner */}
        <section className="unigo-dark-card overflow-hidden p-6 relative bg-slate-900 rounded-[32px] shadow-2xl">
          <div className="relative z-10">
            <span className="unigo-badge unigo-badge--orange bg-orange-500 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">Asosiy xizmat</span>
            <h1 className="mt-4 text-3xl font-black leading-none text-white">{t?.cityTaxi || "Shahar ichida taksi"}</h1>
            <p className="mt-2 text-sm text-slate-400">{t?.cityTaxiHint || "Tez va ishonchli xizmat"}</p>
            <button 
              type="button" 
              className="mt-6 unigo-primary-btn bg-white text-slate-900 font-black h-14 px-8 rounded-2xl shadow-lg hover:shadow-orange-500/20 transition active:scale-95"
              onClick={() => handleNavigate('/client/taxi')}
            >
              {t?.orderNow || "Buyurtma berish"}
            </button>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
             <span className="material-symbols-outlined text-[120px] text-white" data-no-auto-translate="true">local_taxi</span>
          </div>
        </section>

        {/* Xizmatlar Gridi */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t?.services || "Xizmatlar"}</h2>
            <div className="h-1 w-12 bg-slate-200 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {services.map((s) => (
              <button
                key={s.key}
                onClick={() => handleNavigate(s.path)}
                className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition active:scale-[0.97] text-left group"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 group-hover:bg-primaryHome group-hover:text-white transition">
                  <span className="material-symbols-outlined text-[28px]" data-no-auto-translate="true">{s.icon}</span>
                </div>
                <div className="text-sm font-black text-slate-900">{t?.[s.labelKey] || s.fallback}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Avtosavdo qismi */}
        <section className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">{t?.autoMarketTitle || "Avtosavdo"}</h3>
              <p className="text-xs text-slate-500 mt-1">{t?.autoMarketHint || "Mashina e’lonlari"}</p>
            </div>
            <button onClick={() => handleNavigate('/auto-market')} className="h-11 px-6 bg-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 active:scale-95 transition">Ko‘rish</button>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className="mx-auto flex max-w-3xl items-center justify-around rounded-[28px] bg-white/90 backdrop-blur-xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50">
          {[
            { id: 'home', icon: 'home', label: t?.home || 'Asosiy', path: '/client/home' },
            { id: 'orders', icon: 'receipt_long', label: t?.orders || 'Buyurtmalar', path: '/client/orders' },
            { id: 'wallet', icon: 'account_balance_wallet', label: t?.wallet || 'Hamyon', path: '/client/wallet' },
            { id: 'profile', icon: 'person', label: t?.profile || 'Profil', path: '/client/profile' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className="flex flex-1 flex-col items-center py-2 transition active:scale-90"
            >
              <span className="material-symbols-outlined text-[24px] text-slate-400" data-no-auto-translate="true">{item.icon}</span>
              <span className="text-[10px] font-bold text-slate-400 mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <ClientSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} profile={profile} />
    </div>
  );
}

export default memo(ClientHome);