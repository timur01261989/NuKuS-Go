/**
 * ClientDashboard.jsx
 *
 * Asosiy servislar menyusi.
 * Auto-market ALOHIDA modul — bu yerda faqat navigate('/auto-market') ishlatiladi.
 * Hech qanday auto-market kodi eager import qilinmaydi.
 * Admin komponentlari olib tashlangan.
 */
import React, { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// ── Og'ir xizmat sahifalari — LAZY yuklash ──────────────────────────────────
const ClientTaxiPage       = lazy(() => import("../taxi/ClientTaxiPage"));
const DeliveryPage         = lazy(() => import("../delivery/DeliveryPage"));
const ClientInterProvincial = lazy(() => import("../intercity/ClientIntercityPage"));
const ClientFreightPage    = lazy(() => import("../freight/ClientFreightPage"));

// ── Loader ──────────────────────────────────────────────────────────────────
function ServiceLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-primaryHome border-t-transparent animate-spin" />
    </div>
  );
}

// ── Xizmat kartasi ──────────────────────────────────────────────────────────
const ServiceCard = memo(function ServiceCard({ item, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(item.key)}
      className="w-full rounded-3xl p-5 flex flex-col items-center gap-3 transition active:scale-95"
      style={{ background: item.bg, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: "#fff", color: item.color, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
      >
        <span className="material-symbols-outlined text-4xl" data-no-auto-translate="true">
          {item.icon}
        </span>
      </div>
      <span className="text-sm font-bold text-slate-800">{item.title}</span>
      <span className="text-xs text-slate-500 text-center leading-tight">{item.hint}</span>
    </button>
  );
});

// ── Xizmatlar ro'yxati ──────────────────────────────────────────────────────
const SERVICES = [
  {
    key: "taxi",
    title: "Taksi",
    hint: "Tezkor shahar taksisi",
    icon: "local_taxi",
    color: "#F46A0A",
    bg: "#fff7ed",
  },
  {
    key: "delivery",
    title: "Yetkazib berish",
    hint: "Pochta va jo'natmalar",
    icon: "deployed_code_history",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    key: "intercity",
    title: "Shaharlararo",
    hint: "Viloyatlar orasida",
    icon: "south_america",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    key: "freight",
    title: "Yuk tashish",
    hint: "Og'ir yuklar, ko'chish",
    icon: "local_shipping",
    color: "#dc2626",
    bg: "#fef2f2",
  },
  {
    key: "market",
    title: "Avto Savdo",
    hint: "Mashina sotish va sotib olish",
    icon: "directions_car",
    color: "#7c3aed",
    bg: "#faf5ff",
  },
  {
    key: "interdistrict",
    title: "Tumanlararo",
    hint: "Tumanlar orasida yo'l",
    icon: "route",
    color: "#0891b2",
    bg: "#ecfeff",
  },
];

// ── Asosiy komponent ─────────────────────────────────────────────────────────
function ClientDashboard() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleSelect = useCallback((key) => {
    // Auto-market — alohida sahifaga navigate
    if (key === "market") {
      navigate("/auto-market");
      return;
    }
    setSelected(key);
  }, [navigate]);

  const goBack = useCallback(() => setSelected(null), []);

  // ── Xizmat ichida ko'rsatish ──
  if (selected) {
    return (
      <Suspense fallback={<ServiceLoader />}>
        {selected === "taxi"         && <ClientTaxiPage onBack={goBack} />}
        {selected === "delivery"     && <DeliveryPage onBack={goBack} />}
        {selected === "intercity"    && <ClientInterProvincial onBack={goBack} />}
        {selected === "freight"      && <ClientFreightPage onBack={goBack} />}
        {selected === "interdistrict" && (
          <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
            <span className="material-symbols-outlined text-5xl text-slate-300">route</span>
            <p className="text-slate-500 font-medium">Tumanlararo xizmat tez kunda...</p>
            <button
              type="button"
              onClick={goBack}
              className="px-6 py-2 rounded-xl bg-primaryHome text-white font-semibold"
            >
              Orqaga
            </button>
          </div>
        )}
      </Suspense>
    );
  }

  // ── Asosiy menyu ──
  return (
    <div className="p-4 pb-24">
      <div className="grid grid-cols-2 gap-3">
        {SERVICES.map((item) => (
          <ServiceCard key={item.key} item={item} onClick={handleSelect} />
        ))}
      </div>
    </div>
  );
}

export default memo(ClientDashboard);
