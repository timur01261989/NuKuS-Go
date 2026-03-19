function optional(name, fallback = "") {
  return import.meta?.env?.[name] || fallback;
}

export function getClientEnv() {
  // TEMP: Vercel’da qaysi env’lar borligini ko‘rish uchun
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[client env keys]", Object.keys(import.meta?.env || {}));
  }

  return {
    VITE_SUPABASE_URL: optional("VITE_SUPABASE_URL"),
    VITE_SUPABASE_ANON_KEY: optional("VITE_SUPABASE_ANON_KEY"),
    VITE_PAYME_MERCHANT_ID: optional("VITE_PAYME_MERCHANT_ID"),
    VITE_PAYME_CHECKOUT_URL: optional("VITE_PAYME_CHECKOUT_URL"),
    VITE_CLICK_MERCHANT_ID: optional("VITE_CLICK_MERCHANT_ID"),
    VITE_CLICK_SERVICE_ID: optional("VITE_CLICK_SERVICE_ID"),
    VITE_CLICK_CHECKOUT_URL: optional("VITE_CLICK_CHECKOUT_URL"),
  };
}

export function assertClientEnv() {
  const env = getClientEnv();
  const missing = [];
  if (!env.VITE_SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
  if (!env.VITE_SUPABASE_ANON_KEY) missing.push("VITE_SUPABASE_ANON_KEY");
  if (missing.length) {
    throw new Error(`Missing client env: ${missing.join(", ")}`);
  }
  return env;
}

export default getClientEnv;