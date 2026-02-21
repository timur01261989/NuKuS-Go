# Auto Market moduli integratsiyasi (NuKuS-Go)

Bu zip ichiga `src/features/auto-market/` moduli qo‘shildi.

## Nimalar qo‘shildi?
- `AutoMarketEntry.jsx` (router darvozasi, lazy loading, requireAuth, error boundary)
- `MarketContext.jsx` + `zustand` store (filters/favorites/compare/draft persist)
- Feed/Details/Create sahifalar va komponentlar
- Util: image siqish, locales (qq/uz/ru/en) va boshqalar

## Qanday ulash kerak?
1) `react-router-dom` ishlatilayotgan bo‘lsa, `App.jsx` ichida `/auto-market/*` route qo‘shildi (agar App.jsx topilgan bo‘lsa).
2) Agar sizning loyihada route konfiguratsiya boshqa faylda bo‘lsa, `AutoMarketEntry.jsx` ni o‘sha routing joyiga import qilib, `/auto-market/*` ga ulang.

## Eslatma
- `zustand` kerak bo‘ladi: `npm i zustand`
- Agar siz Supabase ishlatsangiz, `src/features/auto-market/services/marketApi.js` ichidagi mock API ni Supabase so‘rovlari bilan almashtirasiz.
