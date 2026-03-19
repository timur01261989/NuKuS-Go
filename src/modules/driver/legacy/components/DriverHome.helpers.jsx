import React from "react";

/**
 * PRODUCTION-GRADE: Statik lug'at.
 * Havaskor xato (Memory leak): Funksiya ichida har safar yangi obyekt yaratish o'rniga,
 * u global skopda bir marta initsializatsiya qilinadi (Zero-allocation).
 */
const SERVICE_LABELS = {
  taxi: "Shahar ichida",
  interProv: "Viloyatlararo",
  interDist: "Tumanlararo",
  delivery: "Yetkazib berish",
  freight: "Yuk tashish",
};

/**
 * Xavfsiz qisqa ID generatori
 * @param {string|number} id
 * @returns {string}
 */
export const safeShortId = (id) => {
  const s = String(id || "");
  if (!s) return "----";
  return s.length <= 8 ? s : `${s.slice(0, 4)}…${s.slice(-4)}`;
};

/**
 * Xizmat yorlig'ini olish
 * @param {string} key
 * @returns {string}
 */
export const getServiceLabel = (key) => {
  return SERVICE_LABELS[key] || key || "";
};

/**
 * Havaskor xato: Har safar array of arrays yaratish o'rniga
 * O(1) complexity bilan to'g'ridan-to'g'ri shartlar tekshiriladi. (Performance Boost)
 * @param {Object} serviceTypes
 * @returns {string|null}
 */
export const getPreferredServiceKey = (serviceTypes) => {
  if (!serviceTypes) return null;

  if (serviceTypes.city?.passenger || serviceTypes.city?.delivery || serviceTypes.city?.freight) {
    return "taxi";
  }
  if (serviceTypes.intercity?.passenger || serviceTypes.intercity?.delivery || serviceTypes.intercity?.freight) {
    return "interProv";
  }
  if (serviceTypes.interdistrict?.passenger || serviceTypes.interdistrict?.delivery || serviceTypes.interdistrict?.freight) {
    return "interDist";
  }
  if (serviceTypes.city?.delivery || serviceTypes.intercity?.delivery || serviceTypes.interdistrict?.delivery) {
    return "delivery";
  }
  if (serviceTypes.city?.freight || serviceTypes.intercity?.freight || serviceTypes.interdistrict?.freight) {
    return "freight";
  }

  return null;
};

/**
 * Xotirani asrash uchun fallback obyekti oldindan yaratiladi.
 */
const FALLBACK_FALSE_STATE = {
  taxi: false,
  interProv: false,
  interDist: false,
  delivery: false,
  freight: false,
};

/**
 * Saqlangan xizmat turlarini xavfsiz o'qish
 * @param {string|null} raw
 * @returns {Object}
 */
export const buildFallbackVisibleServices = (raw) => {
  if (!raw) return FALLBACK_FALSE_STATE;

  try {
    const cached = JSON.parse(raw);
    return {
      taxi: Boolean(cached?.city?.passenger || cached?.city?.delivery || cached?.city?.freight),
      interProv: Boolean(cached?.intercity?.passenger || cached?.intercity?.delivery || cached?.intercity?.freight),
      interDist: Boolean(cached?.interdistrict?.passenger || cached?.interdistrict?.delivery || cached?.interdistrict?.freight),
      delivery: Boolean(cached?.city?.delivery || cached?.intercity?.delivery || cached?.interdistrict?.delivery),
      freight: Boolean(cached?.city?.freight || cached?.intercity?.freight || cached?.interdistrict?.freight),
    };
  } catch (error) {
    console.error("buildFallbackVisibleServices JSON parse error:", error);
    return FALLBACK_FALSE_STATE;
  }
};

/**
 * PRODUCTION-GRADE: ErrorBoundary React'da faqat Class Component bo'lishi shart 
 * (hooks orqali componentDidCatch ekvivalenti yo'q). 
 * Shuning uchun bu yerda Class saqlab qolindi, ammo render qismi toza va zamonaviy UI ga moslashtirildi.
 */
export class DriverServiceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Service crash" };
  }

  componentDidCatch(error, errorInfo) {
    // High-load tizimlarda bu yerni Sentry yoki Datadog ga ulash talab qilinadi
    console.error("Driver service render error:", error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: "" });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b1220] p-4 flex items-center justify-center">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-400 max-w-md w-full shadow-2xl shadow-red-900/20 backdrop-blur-md">
            <div className="text-xl font-bold mb-2">Xizmat sahifasida xato</div>
            <div className="mb-6 text-sm opacity-80 font-mono break-words bg-black/40 p-3 rounded-lg border border-red-500/20">
              {this.state.errorMessage || "Noma'lum xato yuz berdi"}
            </div>
            <button
              type="button"
              onClick={this.props.onBack}
              className="w-full rounded-xl bg-red-600 hover:bg-red-500 transition-colors px-4 py-3 font-bold text-white active:scale-95 shadow-lg shadow-red-900/30"
            >
              Orqaga qaytish
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}