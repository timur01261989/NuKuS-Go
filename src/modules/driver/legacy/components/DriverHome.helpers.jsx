import React from "react";

export function safeShortId(id) {
  const s = String(id || "");
  if (!s) return "----";
  return s.length <= 8 ? s : `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export function getServiceLabel(key) {
  return ({
    taxi: "Shahar ichida",
    interProv: "Viloyatlararo",
    interDist: "Tumanlararo",
    delivery: "Yetkazib berish",
    freight: "Yuk tashish",
  }[key] || key || "");
}

export function getPreferredServiceKey(serviceTypes) {
  const checks = [
    ["taxi", serviceTypes?.city?.passenger || serviceTypes?.city?.delivery || serviceTypes?.city?.freight],
    ["interProv", serviceTypes?.intercity?.passenger || serviceTypes?.intercity?.delivery || serviceTypes?.intercity?.freight],
    ["interDist", serviceTypes?.interdistrict?.passenger || serviceTypes?.interdistrict?.delivery || serviceTypes?.interdistrict?.freight],
    ["delivery", serviceTypes?.city?.delivery || serviceTypes?.intercity?.delivery || serviceTypes?.interdistrict?.delivery],
    ["freight", serviceTypes?.city?.freight || serviceTypes?.intercity?.freight || serviceTypes?.interdistrict?.freight],
  ];
  const found = checks.find((item) => item[1]);
  return found?.[0] || null;
}

export function buildFallbackVisibleServices(raw) {
  try {
    const cached = raw ? JSON.parse(raw) : null;
    return {
      taxi: Boolean(cached?.city?.passenger || cached?.city?.delivery || cached?.city?.freight),
      interProv: Boolean(cached?.intercity?.passenger || cached?.intercity?.delivery || cached?.intercity?.freight),
      interDist: Boolean(cached?.interdistrict?.passenger || cached?.interdistrict?.delivery || cached?.interdistrict?.freight),
      delivery: Boolean(cached?.city?.delivery || cached?.intercity?.delivery || cached?.interdistrict?.delivery),
      freight: Boolean(cached?.city?.freight || cached?.intercity?.freight || cached?.interdistrict?.freight),
    };
  } catch {
    return { taxi: false, interProv: false, interDist: false, delivery: false, freight: false };
  }
}

export class DriverServiceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Service crash" };
  }

  componentDidCatch(error) {
    console.error("Driver service render error:", error);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: "" });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-backgroundLightDriver p-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="text-lg font-bold">Xizmat sahifasida xato</div>
            <div className="mt-2 text-sm">{this.state.errorMessage || "Noma'lum xato"}</div>
            <button
              type="button"
              onClick={this.props.onBack}
              className="mt-4 rounded-xl bg-primarySidebar px-4 py-2 font-semibold text-white"
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
