import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { listMarketCars, formatPriceUZS } from "@services/marketService";
import { useLanguage } from "@shared/i18n/useLanguage";
import UniGoSidebar from "@shared/components/UniGoSidebar";

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

function ServiceCard({ title, subtitle, emoji, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-3xl p-5 bg-white shadow-sm hover:shadow-md active:shadow-sm transition border border-gray-100"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl">
          {emoji}
        </div>
        <div className="flex-1">
          <div className="text-base font-bold text-gray-900">{title}</div>
          <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
        </div>
        <div className="text-gray-300 text-xl">›</div>
      </div>
    </button>
  );
}

export default function ClientHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: "", avatarUrl: "" });
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

        try {
          let pRes = await supabase
            .from("profiles")
            .select("full_name,avatar_url,role")
            .eq("id", user.id)
            .maybeSingle();

          if (pRes.error && /column\s+\"id\"\s+does\s+not\s+exist/i.test(pRes.error.message || "")) {
            pRes = await supabase
              .from("profiles")
              .select("full_name,avatar_url,role")
              .eq("user_id", user.id)
              .maybeSingle();
          }

          const p = pRes.data;
          if (p?.full_name) fullName = p.full_name;
          if (p?.avatar_url) avatarUrl = p.avatar_url;
        } catch {}

        if (mounted) setProfile({ fullName: fullName || (t?.user || "Foydalanuvchi"), avatarUrl });
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, [t]);

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

    return () => {
      mounted = false;
    };
  }, []);

  const services = useMemo(
    () => [
      {
        key: "taxi",
        title: t?.cityTaxi || "Shahar taksi",
        subtitle: t?.cityTaxiSub || "Tez va qulay yurish",
        emoji: "🚕",
        to: "/client/taxi",
      },
      {
        key: "intercity",
        title: t?.interCity || "Viloyatlar aro",
        subtitle: t?.interCitySub || "Reys izlash / band qilish",
        emoji: "🛣️",
        to: "/client/inter-provincial",
      },
      {
        key: "interdistrict",
        title: t?.interDistrict || "Tumanlar aro",
        subtitle: t?.interDistrictSub || "Pitak yoki manzildan manzilga",
        emoji: "🏁",
        to: "/client/inter-district",
      },
      {
        key: "delivery",
        title: t?.delivery || "Eltish",
        subtitle: t?.deliverySub || "Posilka yuborish",
        emoji: "📦",
        to: "/client/delivery",
      },
      {
        key: "freight",
        title: t?.cargo || "Yuk tashish",
        subtitle: t?.cargoSub || "Gazel, Kamaz va h.k.",
        emoji: "🚚",
        to: "/client/freight",
      },
      {
        key: "market",
        title: t?.market || "Avto savdo",
        subtitle: t?.marketSub || "Real mashinalar (admin qo‘shgan)",
        emoji: "🛒",
        to: "/market",
      },
    ],
    [t]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50">
      <UniGoSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-11 h-11 rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition flex items-center justify-center"
            aria-label="Menu"
          >
            ☰
          </button>

          <div className="flex-1">
            <div className="text-sm text-gray-500">{t?.hello || "Salom"}</div>
            <div className="text-base font-bold text-gray-900">{profile.fullName || "UniGo"}</div>
          </div>

          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
            {initials(profile.fullName)}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Services */}
        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-lg font-extrabold text-gray-900">{t?.services || "Xizmatlar"}</h2>
            <button
              type="button"
              onClick={() => navigate("/client/orders")}
              className="text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              {t?.history || "Tarix"} →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((s) => (
              <ServiceCard
                key={s.key}
                title={s.title}
                subtitle={s.subtitle}
                emoji={s.emoji}
                onClick={() => navigate(s.to)}
              />
            ))}
          </div>
        </section>

        {/* Marketplace preview */}
        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-lg font-extrabold text-gray-900">{t?.market || "Avto savdo"}</h2>
            <button
              type="button"
              onClick={() => navigate("/market")}
              className="text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              {t?.seeAll || "Barchasi"} →
            </button>
          </div>

          {cars?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.map((c) => (
                <button
                  key={c.id || c.slug || c.title}
                  type="button"
                  onClick={() => navigate(`/market/car/${c.id || c.slug || ""}`)}
                  className="rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden text-left"
                >
                  <div className="aspect-[16/10] bg-gray-100">
                    {c?.cover_url ? (
                      <img src={c.cover_url} alt={c.title || "car"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🚗</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-gray-900 line-clamp-1">{c.title || "Mashina"}</div>
                    <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                      {(c.city || c.region || "") + (c.year ? ` · ${c.year}` : "")}
                    </div>
                    <div className="mt-2 text-amber-600 font-extrabold">
                      {typeof c.price_uzs === "number" ? formatPriceUZS(c.price_uzs) : (c.price || "")}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-gray-100 p-5 text-gray-500">
              {t?.noCars || "Hozircha mashinalar yo‘q. Admin real e’lon qo‘shganda shu yerda chiqadi."}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
