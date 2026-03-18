export const taxiPricingReminderFlow = [
  {
    id: 'payment-check-before-start',
    title: 'To‘lov turini oldindan tekshirish',
    summary: 'Safar boshlanishidan oldin naqd, karta yoki korporativ tur tanlanganini ko‘rsatish kerak.',
  },
  {
    id: 'fixed-price-before-move',
    title: 'Belgilangan narxni oldindan tasdiqlash',
    summary: 'Fixed price bo‘lsa, yo‘lga chiqishdan oldin haydovchi va mijozga bir xil narx holati ko‘rinishi kerak.',
  },
  {
    id: 'meter-start-visibility',
    title: 'Hisoblagich ishga tushgani ko‘rinsin',
    summary: 'Dinamik narx yoki hisoblagich rejimi ishlasa, safar davomida hisoblash rejimi aniq badge bilan ko‘rsatiladi.',
  },
  {
    id: 'corp-payment-at-finish',
    title: 'Korporativ to‘lovni yakunda ajratish',
    summary: 'Corp/ish safari oqimlari oddiy karta yoki naqd oqimidan alohida vizual statusga ega bo‘lsin.',
  },
];

export const taxiPriceStateRules = {
  calm: {
    key: 'fair',
    label: 'Barqaror narx',
    description: 'Standart sharoit, qo‘shimcha yuklama yo‘q.',
  },
  surge: {
    key: 'surgeUp',
    label: 'Yuklama yuqori',
    description: 'Band vaqtda yoki talab oshganda ko‘tarilgan narx ko‘rsatiladi.',
  },
  discounted: {
    key: 'down',
    label: 'Qulayroq narx',
    description: 'Aksiya, qaytish yo‘li yoki taklif sabab pasaygan narx holati.',
  },
  access: {
    key: 'access',
    label: 'Tarif mavjudligi',
    description: 'Tanlangan tarif hozir ochiqmi yoki cheklanganmi shuni ko‘rsatadi.',
  },
};

export function resolveTaxiPriceState({ surgeMultiplier = 1, isDiscounted = false, hasAccess = true } = {}) {
  if (!hasAccess) return taxiPriceStateRules.access;
  if (isDiscounted) return taxiPriceStateRules.discounted;
  if (Number(surgeMultiplier) > 1) return taxiPriceStateRules.surge;
  return taxiPriceStateRules.calm;
}
