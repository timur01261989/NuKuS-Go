import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { prefetch } from "@/services/platform/prefetchService";
import { supabase } from "@/services/supabase/supabaseClient";
import { listMarketCars, formatPriceUZS } from "@services/marketService";
import { useLanguage } from "@/modules/shared/i18n/useLanguage.js";
import ClientSidebar from "../components/ClientSidebar";

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "U";
  return s.split(/\s+/).slice(0, 2).map((part) => (part[0] || "").toUpperCase()).join("") || "U";
}

const services = [
  { key: "intercity", icon: "south_america", labelKey: "interProv", fallback: "Viloyatlar aro", path: "/client/inter-provincial", prefetchKey: "intercity", hint: "Viloyatdan viloyatga safar" },
  { key: "interdistrict", icon: "route", labelKey: "interDistrict", fallback: "Tumanlar aro", path: "/client/inter-district", prefetchKey: "interDistrict", hint: "Tumanlar orasida yo‘l" },
  { key: "freight", icon: "local_shipping", labelKey: "freight", fallback: "Yuk tashish", path: "/client/freight", prefetchKey: "freight", hint: "Yuk va buyum tashish" },
  { key: "delivery", icon: "deployed_code_history", labelKey: "delivery", fallback: "Eltish xizmati", path: "/client/delivery", prefetchKey: "delivery", hint: "Hujjat va mayda buyum" },
];

const BottomNavItem = memo(function BottomNavItem({ active, icon, label, path, openPath }) {
  const onClick = useCallback(() => openPath(path), [openPath, path]);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition ${active ? "text-primaryHome" : "text-slate-500"}`}
    >
      <span className={`material-symbols-outlined ${active ? "font-variation-fill" : ""}`} data-no-auto-translate="true">{icon}</span>
      <span className={`text-[11px] font-semibold ${active ? "text-primaryHome" : "text-slate-500"}`}>{label}</span>
    </button>
  );
});

const ServiceCard = memo(function ServiceCard({
  icon,
  label,
  hint,
  path,
  openPath,
  prefetchOnEnter,
  prefetchOnTouch,
}) {
  const onClick = useCallback(() => openPath(path), [openPath, path]);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={prefetchOnEnter}
      onTouchStart={prefetchOnTouch}
      className="unigo-soft-card flex w-full flex-col gap-3 p-4 text-left transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="unigo-service-icon material-symbols-outlined text-[26px]" data-no-auto-translate="true">{icon}</span>
        <span className="material-symbols-outlined text-slate-300" data-no-auto-translate="true">arrow_forward_ios</span>
      </div>
      <div>
        <div className="text-[15px] font-extrabold text-slate-900">{label}</div>
        <div className="mt-1 text-xs leading-5 text-slate-500">{hint}</div>
      </div>
    </button>
  );
});

const CarPreviewCard = memo(function CarPreviewCard({ car, fallbackLabel, onOpenMarket }) {
  const title = String(car?.title || car?.model || fallbackLabel || "Avtosavdo").trim();
  const price = Number(car?.price_uzs ?? car?.price);
  const meta = [car?.year, car?.mileage_km ? `${car.mileage_km} km` : null].filter(Boolean).join(" • ");

  return (
    <button type="button" onClick={onOpenMarket} className="unigo-soft-card min-w-[220px] p-4 text-left transition active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <span className="material-symbols-outlined text-[28px]" data-no-auto-translate="true">directions_car</span>
        </div>
        <span className="unigo-badge unigo-badge--blue">Avtosavdo</span>
      </div>
      <div className="mt-4 line-clamp-2 text-[15px] font-extrabold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{meta || "Yangi e’lon"}</div>
      <div className="mt-4 inline-flex rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
        {Number.isFinite(price) ? formatPriceUZS(price) : "Narx ko‘rsatilmagan"}
      </div>
    </button>
  );
});

function ClientHome() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: t.passenger || "Yo‘lovchi", avatarUrl: "" });
  const [cars, setCars] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const user = u?.user;
        if (!user) return;
        let fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        let avatarUrl = user.user_metadata?.avatar_url || "";
        const pRes = await supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle();
        const p = pRes?.data;
        if (p?.full_name) fullName = p.full_name;
        if (p?.avatar_url) avatarUrl = p.avatar_url;
        if (mounted) setProfile({ fullName: fullName || t.userLabel || "Foydalanuvchi", avatarUrl: avatarUrl || "" });
      } catch {}
    })();
    return () => { mounted = false; };
  }, [t.passenger, t.userLabel]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await listMarketCars({ limit: 6 });
        if (mounted) setCars(Array.isArray(list) ? list : []);
      } catch {
        if (mounted) setCars([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const avatarFallback = useMemo(() => initials(profile.fullName), [profile.fullName]);
  const openPath = useCallback((path) => navigate(path), [navigate]);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSettings = useCallback(() => navigate("/settings"), [navigate]);
  const openAutoMarket = useCallback(() => openPath("/auto-market"), [openPath]);

  const displayCars = useMemo(() => {
    if (cars.length) return cars;
    return Array.from({ length: 3 }, (_, index) => ({ id: `fallback-${index}` }));
  }, [cars]);

  return (
    <div className="unigo-page pb-28 font-display text-slate-900">
      <header className="unigo-topbar px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <button type="button" className="flex items-center gap-3 text-left" onClick={openSidebar}>
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white bg-white shadow-sm">
              {profile.avatarUrl ? <img className="h-full w-full object-cover" alt="avatar" src={profile.avatarUrl} /> : <span className="text-sm font-extrabold text-primaryHome">{avatarFallback}</span>}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Assalomu alaykum</div>
              <div className="max-w-[170px] truncate text-base font-extrabold text-slate-900">{profile.fullName || t.userLabel || "Foydalanuvchi"}</div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button type="button" className="unigo-soft-card flex h-11 w-11 items-center justify-center p-0" onClick={openSettings}>
              <span className="material-symbols-outlined text-slate-700" data-no-auto-translate="true">settings</span>
            </button>
            <button type="button" className="unigo-soft-card flex h-11 w-11 items-center justify-center p-0">
              <span className="material-symbols-outlined text-slate-700" data-no-auto-translate="true">notifications</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-5">
        <section className="unigo-dark-card overflow-hidden p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="unigo-badge unigo-badge--orange">Asosiy xizmat</span>
              <h1 className="mt-4 text-[26px] font-black leading-[1.05] text-white">{t.cityTaxi || "Shahar ichida taksi"}</h1>
              <p className="mt-2 max-w-[260px] text-sm leading-6 text-slate-300">{t.cityTaxiHint || "Tez va ishonchli xizmat"}</p>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-white/10 text-white">
              <span className="material-symbols-outlined text-[34px]" data-no-auto-translate="true">local_taxi</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" className="unigo-primary-btn min-h-[54px] px-5" onMouseEnter={prefetch.taxi} onTouchStart={prefetch.taxi} onClick={() => openPath("/client/taxi")}>
              {t.orderNow || "Buyurtma berish"}
            </button>
            <span className="text-xs text-slate-400">Tez chaqirish, aniq narx, xavfsiz safar</span>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-slate-900">{t.services || "Xizmatlar"}</h2>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">UniGo</span>
          </div>
          <div className="unigo-grid-2">
            {services.map((service) => (
              <ServiceCard
                key={service.key}
                icon={service.icon}
                label={t?.[service.labelKey] || service.fallback}
                hint={service.hint}
                path={service.path}
                openPath={openPath}
                prefetchOnEnter={prefetch?.[service.prefetchKey]}
                prefetchOnTouch={prefetch?.[service.prefetchKey]}
              />
            ))}
          </div>
        </section>

        <section className="unigo-soft-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-slate-900">{t.autoMarketTitle || "Avtosavdo"}</div>
              <div className="mt-1 text-sm text-slate-500">{t.autoMarketHint || "Mashina e’lonlari va takliflar"}</div>
            </div>
            <button type="button" className="unigo-secondary-btn min-h-[46px] px-4" onClick={openAutoMarket}>Ko‘rish</button>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-slate-900">{t.newCars || "Yangi qo‘shilgan mashinalar"}</h2>
            <button type="button" className="text-sm font-semibold text-primaryHome" onClick={openAutoMarket}>{t.viewAll || "Barchasi"}</button>
          </div>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
            {displayCars.map((car, index) => (
              <CarPreviewCard key={car.id || index} car={car} fallbackLabel={`E’lon ${index + 1}`} onOpenMarket={openAutoMarket} />
            ))}
          </div>
        </section>
      </main>

      <nav className="unigo-bottom-nav fixed bottom-0 left-0 right-0 z-50 px-3 pb-6 pt-2">
        <div className="mx-auto flex max-w-3xl items-center justify-around gap-2 rounded-[26px] bg-white/90 px-2 py-2 shadow-[0_8px_28px_rgba(28,36,48,.1)]">
          <BottomNavItem active icon="home" label={t.home || "Asosiy"} path="/client/home" openPath={openPath} />
          <BottomNavItem icon="receipt_long" label={t.orders || "Buyurtmalar"} path="/client/orders" openPath={openPath} />
          <BottomNavItem icon="account_balance_wallet" label={t.wallet || "Hamyon"} path="/client/wallet" openPath={openPath} />
          <BottomNavItem icon="person" label={t.profile || "Profil"} path="/client/profile" openPath={openPath} />
        </div>
      </nav>

      <ClientSidebar open={sidebarOpen} onClose={closeSidebar} profile={profile} />
    </div>
  );
}

export default memo(ClientHome);
