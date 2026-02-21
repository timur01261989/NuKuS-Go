# Driver Inter-Provincial (Viloyatlararo) — PRO

Bu modul haydovchi uchun viloyatlararo reyslarni yaratish, yo'lovchi yig'ish, yo'lda navigatsiya va hisobot funksiyalarini beradi.

## Asosiy qo'shilgan PRO funksiyalar
1) **Supabase Realtime**: joy so'rovlari (seat requests) realtime keladi (`useTripSocket.js`).
2) **OSRM Route**: real masofa/vaqt (`services/osrm.js`).
3) **Ayollar uchun rejim**: `RouteBuilder.jsx` ichida switch/selector (faqat ayollar yoki orqa qator ayollar).
4) **Posilka + Rasm**: `ParcelLogModal.jsx` ichida rasm yuklash (kamera: `capture`), qabul qiluvchi tel, SMS payload tayyorlash.
5) **Telegramga ulashish**: reys yaratilgandan keyin `TripStatusPanel.jsx` ichida share tugmasi.
6) **Konfor belgilar**: `CarAmenitiesSelector.jsx` (AC, USB, Luggage, Smoking, Music/WiFi).

## Strukturasi
```
src/features/driver/inter-provincial/
├── InterProvincialPage.jsx
├── context/
│   ├── TripContext.jsx
│   └── tripReducer.js
├── components/
│   ├── setup/
│   │   ├── RouteBuilder.jsx
│   │   ├── VisualSeatSelector.jsx
│   │   ├── DateTimePicker.jsx
│   │   └── CarAmenitiesSelector.jsx   (NEW)
│   ├── controls/
│   │   └── TripStatusPanel.jsx        (NEW: Telegram share)
│   ├── management/
│   │   ├── PassengerManifest.jsx
│   │   ├── SeatRequestModal.jsx
│   │   └── ParcelLogModal.jsx         (Photo + receiver phone)
│   ├── active/
│   │   ├── SmartRoutePanel.jsx
│   │   ├── NavigationLauncher.jsx
│   │   └── SafetyCheck.jsx
│   └── stats/
│       └── TripEarnings.jsx
├── hooks/
│   ├── useTripSocket.js               (Realtime)
│   ├── useSmartSort.js
│   └── useLocationFeatures.js
└── services/
    ├── interProvincialApi.js
    ├── osrm.js                         (NEW)
    └── telegramShare.js                (NEW)
```

## Kerakli kutubxonalar
- `antd`, `@ant-design/icons`
- Supabase: `@supabase/supabase-js` va sizning loyihada `src/lib/supabase.js` bo'lishi kerak:
  - export: `export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`
- OSRM: ochiq endpoint ishlatiladi: `router.project-osrm.org`

Agar supabase yo'q bo'lsa, modul realtime o'rniga **polling/demo** ishlatadi.
