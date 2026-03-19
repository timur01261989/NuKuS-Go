export function getClientEnv() {
  // TEMP: Vercel’da qaysi env’lar borligini ko‘rish uchun
  if (typeof window !== "undefined") {
    // faqat brauzerda
    // diqqat: prod’da ham console’da ko‘rinasan (sirlarni skrinshoptan tashqari joyga bermagin)
    // faqat debugging paytida qoldiramiz
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