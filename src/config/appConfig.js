import { appConfig as sharedAppConfig, syncFeaturesFromUiConfig } from "@/modules/shared/config/appConfig.js";

const APP_ENV = import.meta.env.MODE || "development";
const APP_NAME = import.meta.env.VITE_APP_NAME || "UniGo";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const MAP_TILE_URL = import.meta.env.VITE_MAP_TILE_URL || "";

function readBooleanEnv(name, fallback = false) {
  const raw = import.meta.env[name];
  if (raw == null || raw === "") return fallback;
  return String(raw).trim().toLowerCase() === "true";
}

function getOptionalEnv(name, fallback = "") {
  const value = import.meta.env[name];
  return value == null || value === "" ? fallback : value;
}

function requireEnv(name) {
  const value = getOptionalEnv(name, "");
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

const appConfig = {
  app: {
    name: APP_NAME,
    version: APP_VERSION,
    env: APP_ENV,
    isDev: APP_ENV === "development",
    isProd: APP_ENV === "production",
  },
  api: {
    baseUrl: API_BASE_URL,
  },
  maps: {
    tileUrl: MAP_TILE_URL,
  },
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  },
  features: {
    ...sharedAppConfig.features,
    notifications: readBooleanEnv("VITE_FEATURE_NOTIFICATIONS", true),
    realtime: readBooleanEnv("VITE_FEATURE_REALTIME", true),
  },
};

function getPublicEnv() {
  return {
    APP_ENV: appConfig.app.env,
    APP_NAME: appConfig.app.name,
    APP_VERSION: appConfig.app.version,
    API_BASE_URL: appConfig.api.baseUrl,
    MAP_TILE_URL: appConfig.maps.tileUrl,
    SUPABASE_URL: appConfig.supabase.url,
    FEATURES: { ...appConfig.features },
  };
}

export {
  APP_ENV,
  API_BASE_URL,
  APP_NAME,
  APP_VERSION,
  MAP_TILE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  appConfig,
  getOptionalEnv,
  getPublicEnv,
  requireEnv,
  syncFeaturesFromUiConfig,
};

export default appConfig;
