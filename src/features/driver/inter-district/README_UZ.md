# Driver Inter-District (PRO) moduli

Bu modul **tumanlararo haydovchi** uchun: **Standart (Pitak)** va **Premium (Eshikdan‑Eshikgacha)** rejimlarni bitta sahifada boshqaradi.

## Papkalar va vazifalar

`src/features/driver/inter-district/`

- **InterDistrictPage.jsx** — modul kirish sahifasi. Rejimga qarab UI rangini o‘zgartiradi (`theme-blue` / `theme-gold`) va barcha bloklarni birlashtiradi.

### context/
- **DistrictContext.jsx** — modul “miyasi”. Mode, seats, premiumClients, pricing, partialDeparture va boshqalarni saqlaydi.
- **pricingReducer.js** — state’ni reducer orqali boshqaradi.

### hooks/
- **usePitakLogic.js** — Standart rejim navbat (queue) mantiqi.
- **usePremiumSocket.js** — Premium rejimda Supabase Realtime orqali `district_requests` jadvalidan real so‘rovlarni tinglaydi.

### services/
- **districtApi.js** — Supabase bilan ishlash (queue, requests, locations).
- **districtData.js** — statik tarif va yo‘nalish ma’lumotlari.
- **osrm.js** — OSRM orqali masofa/vaqt (fallback: haversine).
- **supabaseClient.js** — Supabase client import. Loyihangizda `@/lib/supabase` bo‘lishi kerak.

### components/
- **shared/** — ikkala rejimga umumiy: `ModeSwitchToggle`, `CarSeatVisualizer`, `TripEarnings`.
- **modes/standard/** — Pitak: `PitakQueueBoard`, `FixedRouteCard` (bekatlar ketma‑ketligi bilan), `PassengerListSimple`.
- **modes/premium/** — Eshikdan: `ClientLocatorMap` (realtime requestlar ro‘yxati), `DoorToDoorNav` (navigator), `DynamicPriceCard` (pickup + chala ketish).
- **parcel/** — `ParcelEntryModal` (posilka kiritish demo).

### styles/
- **theme.css** — rejim ranglari va header dizayni.

## Qo‘shilgan PRO funksiyalar

1) **Rejimni rang bilan ajratish:**
- Standart = ko‘k, Premium = tillarang.
- `InterDistrictPage.jsx` wrapper: `className={mode === 'PREMIUM' ? 'theme-gold' : 'theme-blue'}`.

2) **Chala ketish (Partial Departure) — Premium:**
- `DynamicPriceCard.jsx` ichida switch.
- Strategiya: 
  - `driver_cover` — bo‘sh joy pulini haydovchi qoplaydi.
  - `split_to_clients` — bo‘sh joy narxini o‘tirgan mijozlarga bo‘lib qo‘shadi.

3) **Bekatlar ketma‑ketligi (Route Ordering):**
- `FixedRouteCard.jsx` bekatlarni Tag ko‘rinishida chiqaradi.

4) **Realtime seat requestlar (Premium):**
- `usePremiumSocket.js` Supabase realtime orqali `district_requests` INSERT/UPDATE ni tinglaydi.

5) **OSRM masofa/vaqt:**
- `osrm.js` orqali pickup masofa/ETA hisoblanadi (fallback mavjud).

## Eslatma
- Supabase sozlanmagan bo‘lsa, modul yiqilmaydi, faqat realtime va queue funksiyalari to‘liq ishlamasligi mumkin.
- `supabaseClient.js` dagi import yo‘lini loyihangizga moslang.
