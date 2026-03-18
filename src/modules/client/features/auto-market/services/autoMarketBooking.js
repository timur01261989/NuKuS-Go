export function buildBookingFlow(ad = {}, seller = {}) {
  const price = Number(ad?.price || 0);
  const reservationFee = Math.max(50000, Math.min(Math.round(price * 0.003), 350000));
  const testDriveFee = Math.max(0, Math.min(Math.round(price * 0.0015), 150000));
  const city = ad?.city || seller?.city || "Toshkent";
  const slots = [
    { key: "today-1", label: "Bugun 11:00", tone: "#0ea5e9", type: "showroom", note: "Tez ko‘rish va seller bilan tanishuv." },
    { key: "today-2", label: "Bugun 16:30", tone: "#10b981", type: "test-drive", note: "Test drive va tez kelishuv uchun." },
    { key: "tomorrow-1", label: "Ertaga 10:00", tone: "#8b5cf6", type: "inspection", note: "Ko‘rik va hujjatlarni birga ko‘rish." },
  ];
  const steps = [
    { key: "choose", title: "Vaqtni tanlang", text: "Xaridor showroom yoki test drive vaqtini tanlaydi.", tone: "#2563eb" },
    { key: "confirm", title: "Seller tasdiqlaydi", text: "Seller ichki jadvaldan bir bosishda tasdiq beradi.", tone: "#0f766e" },
    { key: "attend", title: "Ko‘rish va tekshiruv", text: "Uchrashuvda mashina, hujjat va narx bir joyda ko‘riladi.", tone: "#f59e0b" },
  ];
  return {
    city,
    reservationFee,
    testDriveFee,
    slots,
    steps,
  };
}

export function buildBookingActions(ad = {}, seller = {}) {
  const flow = buildBookingFlow(ad, seller);
  return [
    {
      key: "reserve",
      title: "Bron qilish",
      amount: flow.reservationFee,
      text: "Mashina vaqtincha ushlab turiladi va boshqa xaridorlar orasida yo‘qolib ketmaydi.",
      providerHint: "Click yoki Payme tavsiya qilinadi",
      tone: "#0f172a",
    },
    {
      key: "test-drive",
      title: "Test drive band qilish",
      amount: flow.testDriveFee,
      text: "Sotuvchi bilan vaqt kelishib, real haydash tajribasini olasiz.",
      providerHint: "Click, Payme yoki Uzcard",
      tone: "#0ea5e9",
    },
    {
      key: "inspection",
      title: "Ko‘rik vaqtini belgilash",
      amount: 0,
      text: "Ko‘rikni bepul belgilab, keyin VIN yoki ekspertiza xizmatini tanlash mumkin.",
      providerHint: "Avval vaqt, keyin xizmat",
      tone: "#22c55e",
    },
  ];
}
