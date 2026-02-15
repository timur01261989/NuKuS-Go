# Freight (Yuk mashina) moduli — O‘zbekcha qo‘llanma

Yo‘l: `src/features/client/freight/`

Bu modul **yuk mashina chaqirish** uchun (Labo/Gazel/Isuzu...).
Taxi moduliga o‘xshash prinsip: **A nuqta (Yuklash)** va **B nuqta (Tushirish)** xaritadan tanlanadi, masofa hisoblanadi, narx avtomatik chiqadi.

## Fayllar nima qiladi?

- `ClientFreightPage.jsx` ⭐ — Kirish nuqtasi (Main Entry). UI yig‘iladi.
- `context/FreightContext.jsx` 🧠 — Miya: truck, A/B manzil, gruzchik, foto, narx state’lari.
- `map/FreightMap.jsx` 🗺 — Xarita: markaz pin ko‘tarilishi, reverse geocode, route chizish.
- `map/useFreightRoute.js` — OSRM + fallback + debounce/abort.
- `components/Selection/*` 🚛 — Mashina turini rasm/ikon bilan tanlash.
- `components/Details/*` 📸💪📝 — Foto upload, gruzchik switch+counter, yuk form.
- `components/Order/*` 💰 — Narx estimator va active panel (qidiruv/kelish).
- `services/truckData.js` 📄 — Mashina turlari va tariflari.
- `services/freightApi.js` 📡 — API so‘rovlar (default: `apiHelper`).

## Integratsiya
1) Route’ga ulang: `ClientFreightPage`
2) Kerakli paketlar: `leaflet`, `react-leaflet`, `antd`
3) `apiHelper` import yo‘li: `@/utils/apiHelper` (sizda bor)

## Eslatma
- Nominatim/OSRM tekin servis: fallback bor.
- Foto hozir local state’da. Backendga yuborish kerak bo‘lsa `freightApi.createFreightOrder` ichida FormData qilasiz.
