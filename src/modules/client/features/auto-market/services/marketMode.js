import { clientLogger } from "@/modules/shared/utils/clientLogger.js";

const PRODUCTION =
  (typeof import.meta !== "undefined" && import.meta?.env?.PROD) ||
  (typeof process !== "undefined" && process?.env?.NODE_ENV === "production");

const ALLOWED_MODES = new Set(["mock", "backend"]);

function readRawMode() {
  return (
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_AUTO_MARKET_MODE) ||
    (typeof process !== "undefined" && process?.env?.REACT_APP_AUTO_MARKET_MODE) ||
    ""
  );
}

export function getAutoMarketMode() {
  const raw = String(readRawMode() || "").trim().toLowerCase();

  if (raw && !ALLOWED_MODES.has(raw)) {
    clientLogger.warn("auto_market.invalid_mode", {
      raw,
      fallback: PRODUCTION ? "backend" : "mock",
    });
  }

  if (raw === "backend") return "backend";
  if (raw === "mock") return PRODUCTION ? "backend" : "mock";
  return PRODUCTION ? "backend" : "mock";
}

export function isAutoMarketMockMode() {
  return getAutoMarketMode() === "mock";
}

export function assertAutoMarketBackendMode(featureName = "Auto Market") {
  const mode = getAutoMarketMode();
  if (mode !== "backend") {
    clientLogger.warn("auto_market.backend_required", { featureName, mode });
    return false;
  }
  return true;
}

export function getAutoMarketModeMeta() {
  return {
    mode: getAutoMarketMode(),
    production: Boolean(PRODUCTION),
  };
}
