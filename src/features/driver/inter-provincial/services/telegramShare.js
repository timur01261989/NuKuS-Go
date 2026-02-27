export function buildTripShareText(trip) {
  const from = trip?.route?.from || "Noma'lum";
  const to = trip?.route?.to || "Noma'lum";
  const dt = trip?.dateTimeLabel || "Bugun";
  const free = (trip?.seats || []).filter((s) => !s.taken && s.type !== "parcel").length;
  const extra =
    trip?.femaleMode === "ALL_FEMALE"
      ? "🚺 Faqat ayollar uchun"
      : trip?.femaleMode === "BACK_ONLY"
      ? "🚺 Orqa qator ayollar uchun"
      : "";

  const am = (trip?.amenities || []).length ? `
✨ Qulayliklar: ${trip.amenities.join(", ")}` : "";

  return `🚖 *${from} ➜ ${to}*
📅 ${dt}
💺 ${free} ta joy bor${extra ? `
${extra}` : ""}${am}
📱 Band qilish: ${trip?.deepLink || "[Ilova linki]"}`;
}

export function openTelegramShare({ url, text }) {
  const tg = `https://t.me/share/url?url=${encodeURIComponent(url || "")}&text=${encodeURIComponent(text || "")}`;
  window.open(tg, "_blank");
}
