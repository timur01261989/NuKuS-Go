function required(name, value) {
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

export function getServerEnv() {
  return {
    NODE_ENV: process.env.NODE_ENV || "development",
    SUPABASE_URL: required("SUPABASE_URL", process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    AUTH_SECRET: process.env.AUTH_SECRET || "",
    LEGACY_AUTH_ENABLED: String(process.env.LEGACY_AUTH_ENABLED || "").toLowerCase() === "true",
    PAYME_MERCHANT_KEY: process.env.PAYME_MERCHANT_KEY || "",
    CLICK_SECRET_KEY: process.env.CLICK_SECRET_KEY || "",
    CLICK_SERVICE_ID: process.env.CLICK_SERVICE_ID || "",
    CLICK_MERCHANT_ID: process.env.CLICK_MERCHANT_ID || "",
  };
}

export function assertServerEnv() {
  return getServerEnv();
}

export default getServerEnv;
