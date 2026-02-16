# AUTO MARKET MODUL (PRO) — O'zbekcha README

Bu papka `src/features/auto-market/` ichiga qo'yiladi. Modul faqat **Avto savdo** uchun moslangan.

## 1) AutoMarketEntry.jsx (Modulning darvozasi)
- `/auto-market/*` ichidagi routingni boshqaradi
- Sahifalar lazy load bo'ladi (tez ochiladi)
- `RequireAuth` bilan `create` va `my-ads` sahifalariga kirishda login tekshiradi
- ErrorBoundary bilan modul ichidagi xatolar butun ilovani qulatmaydi

## 2) context/MarketContext.jsx (Modulning miyasi)
- Mashinalar ro'yxatini yuklaydi (listCars)
- Pagination (`loadMore`) ni boshqaradi
- Details (getCarById) va Create (createCarAd) ni services orqali chaqiradi
- Filtrlar Zustand store orqali saqlanadi

## 3) stores/marketStore.js (Zustand global state)
- Til: lang
- Filterlar: filters
- Favorites: favorites
- Compare: compare
- Recently viewed: recently
- Create ad draft: draft
> Hammasi localStorage'da persist bo'ladi (internet uzilsa ham o'chmaydi)

## 4) components/Create/CreateAdWizard.jsx
- Step-by-step wizard
- Har stepda minimal validatsiya
- Draft localStorage'da saqlanadi (Zustand persist)
- PreviewModal orqali e'lon ko'rinishi oldindan ko'riladi

## 5) services/marketApi.js
- Hozircha MOCK (offline ishlashi uchun)
- Keyin Supabase ulash uchun shu faylni almashtirasiz:
  - listCars
  - getCarById
  - createCarAd
  - listMyAds
