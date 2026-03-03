import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { prefetch } from "@/lib/prefetch";
import { supabase } from "@/lib/supabase";
import { listMarketCars, formatPriceUZS } from "@services/marketService";
import { useLanguage } from "@shared/i18n/useLanguage";
import ClientSidebar from "../components/ClientSidebar";

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => (p[0] || "").toUpperCase()).join("") || "U";
}

export default function ClientHome() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: "Foydalanuvchi", avatarUrl: "" });
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
            .select("full_name,avatar_url")
            .eq("id", user.id)
            .maybeSingle();

          // Fallback: some schemas use profiles.user_id instead of profiles.id
          if (pRes.error && /column\s+\"id\"\s+does\s+not\s+exist/i.test(pRes.error.message || "")) {
            pRes = await supabase
              .from("profiles")
              .select("full_name,avatar_url")
              .eq("user_id", user.id)
              .maybeSingle();
          }

          const p = pRes.data;
          if (p?.full_name) fullName = p.full_name;
          if (p?.avatar_url) avatarUrl = p.avatar_url;
        } catch {
          // ignore
        }

        if (mounted) {
          setProfile({
            fullName: fullName || "Foydalanuvchi",
            avatarUrl: avatarUrl || "",
          });
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  const avatarFallback = useMemo(() => initials(profile.fullName), [profile.fullName]);

  return (
    <div className="min-h-screen pb-24 bg-softBlue dark:bg-backgroundDark font-display text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-softBlue/80 dark:bg-backgroundDark/80 backdrop-blur-md">
        <button
          type="button"
          className="flex items-center gap-3 text-left"
          onClick={() => setSidebarOpen(true)}
        >
          <div className="size-10 rounded-full overflow-hidden border-2 border-primaryHome flex items-center justify-center bg-white">
            {profile.avatarUrl ? (
              <img
                className="w-full h-full object-cover"
                alt="avatar"
                src={profile.avatarUrl}
              />
            ) : (
              <span className="text-sm font-bold text-primaryHome">{avatarFallback}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Xush kelibsiz</p>
            <h1 className="text-lg font-bold leading-none tracking-tight">{t?.appName || "UniGo"}</h1>
          </div>
        </button>

        <button type="button" className="neumorphic-dark p-2 rounded-xl text-primaryHome">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <main className="px-4 space-y-6">
        {/* Main Service: City Taxi */}
        <section className="mt-4">
          <div className="neumorphic-dark rounded-2xl overflow-hidden p-1">
            <div className="relative h-48 rounded-xl overflow-hidden">
              <img
                className="w-full h-full object-cover"
                alt="taxi"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZ5RHRrcqAdtLXXxWBcOvZs_KD32FUb7YdVjteNkkkhWjhfBHBKG2gB_RSlsRaYwrfRZUwHixUJmclJITyR47DG2p4FTJqQfWxKq0l17XyiD1Q7kicXJ3ciB4bDmp4xRF52nGbLE6x-LQ2AwYb9Z_7LssASTvhhyjaRMSakVJ1D1WIwnNrOS-3ri9C3Yajle213_nKptAO9IsWfiI5npd7USNZIK2iwXdkfaV2pmDX2gnJGgaVtW7f46Jyaw53Jdp8n6JG-9737w0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-backgroundDark/90 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div>
                  <h2 className="text-xl font-bold text-white">{t?.cityTaxi || "Shahar ichida taksi"}</h2>
                  <p className="text-slate-300 text-sm">{t?.cityTaxiHint || "Tez va ishonchli xizmat"}</p>
                </div>
                <button
                  type="button"
                  className="bg-primaryHome hover:bg-primaryHome/90 text-backgroundDark font-bold py-2 px-6 rounded-lg transition-transform active:scale-95 shadow-lg"
                  onMouseEnter={prefetch.taxi}
                  onTouchStart={prefetch.taxi}
                  onClick={() => navigate("/client/taxi")}
                >
                  Buyurtma berish
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Service Grid */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Xizmatlar</h3>
            <span className="text-primaryHome text-sm font-medium">Hammasi</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
  <ServiceCard
    icon="map"
    label={t?.interProv || "Viloyatlar aro"}
    onMouseEnter={prefetch.intercity}
    onTouchStart={prefetch.intercity}
    onClick={() => navigate("/client/inter-provincial")} 
  />
  <ServiceCard
    icon="distance"
    label={t?.interDistrict || "Tumanlar aro"}
    onMouseEnter={prefetch.interDistrict}
    onTouchStart={prefetch.interDistrict}
    onClick={() => navigate("/client/inter-district")} 
  />
</div>
            <ServiceCard
              icon="local_shipping"
              label={t?.freight || "Yuk tashish"}
              onMouseEnter={{prefetch.freight}}
                  onTouchStart={{prefetch.freight}}
                  onClick={() => navigate("/client/freight")} />
            <ServiceCard
              icon="package_2"
              label={t?.delivery || "Eltish xizmati"}
              onMouseEnter={{prefetch.delivery}}
                  onTouchStart={{prefetch.delivery}}
                  onClick={() => navigate("/client/delivery")} />
          </div>
        </section>

        {/* Auto Savdo Banner */}
        <section>
          <button
            type="button"
            className="w-full neumorphic-dark rounded-2xl p-4 flex items-center justify-between bg-gradient-to-r from-cardDark to-primaryHome/10 border-l-4 border-primaryHome text-left"
            onClick={() => navigate("/auto-market")}
          >
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Avto Savdo</h3>
              <p className="text-sm text-slate-400">Mashina sotib oling va soting</p>
            </div>
            <div className="text-primaryHome">
              <span className="material-symbols-outlined text-4xl">directions_car</span>
            </div>
          </button>
        </section>

        {/* New Cars */}
        <section className="pb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Yangi qo'shilgan mashinalar</h3>
            <button
              type="button"
              className="text-primaryHome text-sm font-medium"
              onClick={() => navigate("/auto-market")}
            >
              Barchasi
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
            {(cars.length ? cars : Array.from({ length: 3 }).map((_, i) => ({ id: "p" + i }))).map(
              (c, i) => (
                <CarCard
                  key={c.id || i}
                  title={c.title || c.model || `Mashina ${i + 1}`}
                  year={c.year}
                  priceUZS={c.price_uzs ?? c.price}
                  image={c.image}
                  onClick={() => navigate("/auto-market")}
                />
              )
            )}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-softBlue dark:bg-backgroundDark/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 pb-6 pt-2">
        <div className="flex justify-around items-center">
          <BottomNavItem
            active
            icon="home"
            label="Asosiy"
            onClick={() => navigate("/client/home")}
          />
          <BottomNavItem
            icon="receipt_long"
            label="Buyurtmalar"
            onClick={() => navigate("/client/orders")}
          />
          <BottomNavItem
            icon="account_balance_wallet"
            label="Hamyon"
            onClick={() => navigate("/client/wallet")}
          />
          <BottomNavItem
            icon="person"
            label="Profil"
            onClick={() => navigate("/client/profile")}
          />
        </div>
      </nav>

      <ClientSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} profile={profile} />
    </div>
  );
}

function ServiceCard({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="neumorphic-dark p-4 rounded-2xl flex flex-col items-center text-center gap-3 active:scale-95 transition-all"
    >
      <div className="bg-primaryHome/10 p-3 rounded-xl text-primaryHome">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <p className="text-sm font-semibold">{label}</p>
    </button>
  );
}

function CarCard({ title, year, priceUZS, image, onClick }) {
  const priceLabel =
    typeof priceUZS === "number" ? formatPriceUZS(priceUZS) : priceUZS ? String(priceUZS) : "";
  const yearLabel = year ? String(year) + " yil" : "";
  const img = image || "";

  return (
    <button
      type="button"
      onClick={onClick}
      className="neumorphic-dark min-w-[200px] w-52 rounded-2xl overflow-hidden p-2 text-left"
    >
      <div className="h-32 rounded-xl overflow-hidden mb-3 bg-slate-800/30">
        {img ? (
          <img className="w-full h-full object-cover" alt={title} src={img} />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>
      <div className="px-2 pb-2">
        <h4 className="font-bold text-sm truncate">{title}</h4>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-slate-400">{yearLabel}</span>
          <span className="text-primaryHome font-bold text-sm">{priceLabel}</span>
        </div>
      </div>
    </button>
  );
}

function BottomNavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-col items-center gap-1 " +
        (active ? "text-primaryHome" : "text-slate-400")
      }
    >
      <span className={"material-symbols-outlined " + (active ? "font-variation-fill" : "")}>
        {icon}
      </span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}