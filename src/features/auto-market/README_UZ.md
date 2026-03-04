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

## To'lov tizimi (Auto Market)
Auto Market ichida pullik funksiyalar server tomonda ishlaydi (client manipulyatsiya qilmasin):

### Pullik actionlar
1) **Raqamni ko'rish (Contact Reveal)**
   - Endpoint: `POST /api/auto-market/contact/reveal`
   - Walletdan yechadi va `auto_contact_reveals` ga yozadi.

2) **Promo: TOP/VIP/RAISE**
   - Endpoint: `POST /api/auto-market/promo/buy`
   - Walletdan yechadi va `auto_promotions` ga yozadi.
   - TOP paketlarda `auto_ads.is_top=true` qo'yadi.

### Top-up (balans to'ldirish)
Endpoint: `POST /api/auto-market/payment/create`

Providerlar:
- `demo` — darhol walletni to'ldiradi (contract yo'q paytda ishlatish uchun)
- `payme` — invoice yaratadi va `payment_url` qaytaradi (merchant keylarni ENV ga qo'yasiz)
- `click` — invoice yaratadi va `payment_url` qaytaradi (merchant keylarni ENV ga qo'yasiz)

> Payme/Click callback verifikatsiyasi skeleton ko'rinishda berilgan.
> Real shartnomaga o'tganingizda signature tekshiruvini yoqasiz.

### SQL
Yangi jadval va paid-actionlar uchun:
- `sql/auto_market_payments_addon.sql`

### ENV (Vercel/Local)
Server (Vercel) env:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTO_MARKET_REVEAL_PHONE_PRICE_UZS` (default 5000)
- `AUTO_MARKET_TOP_1DAY_PRICE_UZS` (default 15000)
- `AUTO_MARKET_TOP_3DAY_PRICE_UZS` (default 35000)
- `AUTO_MARKET_VIP_7DAY_PRICE_UZS` (default 50000)
- `AUTO_MARKET_RAISE_PRICE_UZS` (default 8000)

Payme (ixtiyoriy):
- `PAYME_MERCHANT_ID`
- `PAYME_SECRET` (callback signature uchun)

Click (ixtiyoriy):
- `CLICK_SERVICE_ID`
- `CLICK_MERCHANT_ID`
- `CLICK_SECRET_KEY`

Cron (ixtiyoriy):
- `AUTO_MARKET_CRON_SECRET`

Client (Vite) env:
- `VITE_API_BASE_URL` (masalan: `https://<your-vercel>.vercel.app/api`)

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
