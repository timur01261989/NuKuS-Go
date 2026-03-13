import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const CreateAdContext = createContext(null);
const LS_KEY = "auto_market_create_draft_v1";

const defaultAd = {
  title: "",
  brand: "",
  model: "",
  year: "",
  mileage: "",
  city: "",
  price: "",
  currency: "UZS",
  fuel_type: "",
  transmission: "",
  color: "",
  body_type: "",
  drive_type: "",
  engine: "",
  kredit: false,
  exchange: false,
  description: "",
  vin: "",
  comfort: { ac: false, abs: false, sunroof: false, airbags: false },
  images: [],
  seller: { name: "", phone: "" },
  location: { lat: null, lng: null, city: "" },
  is_top: false,

  // YANGI: Vikup (Rent-to-Own) maydonlari
  vikup: false,              // vikupga berilmoqda
  vikup_initial: "",         // boshlang'ich to'lov (USD)
  vikup_monthly: "",         // oylik to'lov (USD)
  vikup_months: "12",        // muddat (oy)
  vikup_interest: "0",       // foiz stavkasi

  // YANGI: Barter maydonlari
  barter: false,             // barter qabul qilinadi
  barter_brand: "",          // qaysi brend qabul qilinadi
  barter_model: "",          // qaysi model qabul qilinadi
  barter_extra_ok: false,    // ustiga pul to'lashga tayyor
};

function safeParse(raw, fallback) {
  try { const v = JSON.parse(raw); return v && typeof v === "object" ? v : fallback; } catch { return fallback; }
}

export function CreateAdProvider({ children }) {
  const didInit = useRef(false);
  const [step, setStep] = useState(0);
  const [ad, setAd] = useState(defaultAd);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const draft = safeParse(raw, null);
    if (!draft) return;
    if (draft.ad) setAd((p) => ({ ...p, ...draft.ad }));
    if (typeof draft.step === "number") setStep(Math.max(0, Math.min(4, draft.step)));
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ ad, step, updatedAt: Date.now() })); } catch {}
  }, [ad, step]);

  const value = useMemo(() => ({
    step, setStep, ad, setAd,
    patch: (patch) => setAd((p) => ({ ...p, ...patch })),
    reset: () => { setStep(0); setAd(defaultAd); try { localStorage.removeItem(LS_KEY); } catch {} },
  }), [step, ad]);

  return <CreateAdContext.Provider value={value}>{children}</CreateAdContext.Provider>;
}

export function useCreateAd() {
  const ctx = useContext(CreateAdContext);
  if (!ctx) throw new Error("useCreateAd must be used inside CreateAdProvider");
  return ctx;
}
