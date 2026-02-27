# Intercity (Viloyatlararo) modul

Papka: `src/features/client/intercity/`

Bu modul **viloyatlararo (intercity) taksi / reys** sahifasini bo'laklarga ajratilgan professional tuzilma bilan beradi.

## Fayl tuzilmasi va vazifalar

- `ClientIntercityPage.jsx` ⭐  
  **Kirish nuqtasi (Main Entry)**. Context provider ichida asosiy UI'ni chiqaradi: shaharlar, sana, yo'lovchi, reyslar, o'rindiqlar, so'rov yuborish.

- `context/IntercityContext.jsx` 🧠  
  **Miya**. A/B shahar, sana, yo'lovchi soni, o'rindiq tanlash, tanlangan haydovchi (offer) state'lari shu yerda.

- `map/IntercityMap.jsx` 🗺  
  **Xarita**. A va B shaharni ko'rsatadi va marshrut polyline chizadi.

- `map/useRoutePolyline.js`  
  **Masofani chizish logikasi**. OSRM orqali marshrut oladi, ishlamasa fallback straight-line chizadi. AbortController bilan eski request'larni bekor qiladi.

- `components/Header/RouteHeader.jsx`  
  `"Toshkent ➝ Nukus"` kabi sarlavha va orqaga tugma (hozir modul ichida ishlatilmadi, xohlasangiz qo'shib yuborasiz).

- `components/Filters/DatePickerSheet.jsx` 📅  
  Pastdan chiqadigan (bottom) `Drawer` ichida sana tanlash.

- `components/Filters/PassengerCount.jsx` 👥  
  Yo'lovchi soni: 1,2,3,4.

- `components/Seats/SeatSelector.jsx` 💺  
  Salon sxemasi va o'rindiq tanlash (A1,A2,B1,B2). Yo'lovchi soni limitiga amal qiladi.

- `components/Seats/Legend.jsx`  
  Oq=Bo'sh, Kulrang=Band, Ko'k=Sizniki.

- `components/Drivers/DriverOfferList.jsx` 📋  
  Haydovchi reyslarini pastdan chiqadigan `Drawer` ichida ko'rsatadi. Qidirish + yangilash bor.

- `components/Drivers/DriverCard.jsx` 🚕  
  Bitta haydovchi kartochkasi: ism, mashina, raqam, narx, seat info.

- `services/intercityApi.js` 📡  
  Server bilan aloqa (API wrapper). Backenddagi endpoint/actions shu yerda jamlangan.

## Backend (API) eslatma

Default: `POST /api/intercity`

Kutiladigan action'lar:
- `list_offers` — reyslarni olish
- `request_booking` — haydovchiga so'rov yuborish
- `my_bookings` — mening so'rovlarim
- `cancel_booking` — so'rovni bekor qilish

Agar sizda endpoint nomi yoki action nomlari boshqacha bo'lsa, `services/intercityApi.js` faylini moslab o'zgartiring.

## Ulanish (Import)

Router ichida:
```jsx
import ClientIntercityPage from "@/features/client/intercity/ClientIntercityPage";
```

Leaflet CSS:
```js
import "leaflet/dist/leaflet.css";
```
