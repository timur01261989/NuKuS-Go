# Auto Market moduli (src/features/auto-market)

Bu modul Universal Market'dan *faqat AVTO savdo* uchun ajratib qayta qurildi.
Arxitektura keyin kengaytirishga qulay: servislar bitta joyda, contextlar ajratilgan, UI komponentlar lego kabi.

## Router
- `AutoMarketEntry.jsx` — modul kirish nuqtasi.
  Routerga shunday ulanadi:
  ```jsx
  <Route path="/auto-market/*" element={<AutoMarketEntry />} />
  ```

## Contextlar
- `context/MarketContext.jsx` — filterlar va ularning localStorage persist holati.
- `context/CreateAdContext.jsx` — e'lon berish wizard draft (orqaga qaytsa ham o'chmaydi).
- `context/CompareContext.jsx` — solishtirish ro'yxati (max 4 ta), localStorage bilan.

## Services
- `services/marketBackend.js` — hozircha mock-first (localStorage seed). Keyin Supabase/Backend ulash oson.
- `services/staticData.js` — brand/model/fuel/cities va boshqalar.
- `services/priceUtils.js` — narx formatlash va valyuta konvert (demo).

## Hooks
- `hooks/useCarList.js` — listing pagination + loading/error.
- `hooks/useCarDetails.js` — bitta e'lon + price history.
- `hooks/useUploadImages.js` — demo uploader (local URL). Keyin storagega o'tkazasiz.
- `hooks/useRecentlyViewed.js` — ko'rilganlar tarixi (localStorage).

## Pages
- `pages/FeedPage.jsx` — bosh sahifa (stories + smart filter + grid).
- `pages/DetailsPage.jsx` — detail (gallery, specs, VIN, history, seller).
- `pages/FavoritesPage.jsx` — sevimlilar.
- `pages/MyAdsPage.jsx` — mening e'lonlarim.
- `pages/ComparePage.jsx` — solishtirish.

## Kengaytirish uchun tayyor joylar
- Chat realtime: DetailsPage ichida `SellerProfile.onChat` hozir placeholder. Supabase realtime ulab qo'yish mumkin.
- Nearby search: MarketContext filterlarda `nearMe/radiusKm/center` bor.
- Stories: `is_top=true` e'lonlar StoriesRail'da chiqadi.
