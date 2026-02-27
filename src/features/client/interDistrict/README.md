# interDistrict moduli (Shahar/Tuman ichida yo‘nalish)

Joylashuvi:
`src/features/client/interDistrict/`

## Fayllar nima qiladi?

### 1) ClientInterDistrictPage.jsx ⭐
Asosiy kirish komponenti. Shu sahifani route/menyudan ochasiz.
Ichida:
- tuman tanlash
- vaqt tanlash
- o‘rindiq sxemasi
- haydovchi takliflari
- buyurtma yaratish

### 2) context/DistrictContext.jsx 🧠
“Miya” - barcha state’lar shu yerda:
- fromDistrict, toDistrict
- departureTime
- seatState (tanlangan o‘rindiqlar)
- routeInfo (distance/duration/price)
- filters (AC/yukxona)

### 3) map/DistrictMap.jsx 🗺
Xaritada Nukus → tanlangan tuman polyline chizadi.

### 4) map/useDistrictRoute.js
Masofa/vaqt/narxni avtomatik hisoblaydi (haversine + formula).

### 5) components/Header/DistrictHeader.jsx
Sarlavha va orqaga tugma.

### 6) components/Selection/DistrictList.jsx 🏙
Tumanlar ro‘yxati (Xo'jayli, Qo'ng'irot, ...)

### 7) components/Selection/DepartureTime.jsx ⏱
Ketish vaqti: hozir / 1 soatdan keyin / 2 soatdan keyin

### 8) components/Seats/CarSeatSchema.jsx 💺
O‘rindiqlar sxemasi. Tanlangan o‘rindiqlar seatState.selected ichida saqlanadi.

### 9) components/Seats/SeatLegend.jsx
Ranglar ma’nosi.

### 10) components/Drivers/FilterBar.jsx ⚙️
Filterlar: konditsioner, yukxona.

### 11) components/Drivers/DriverOfferCard.jsx 🚕
Haydovchi taklifi kartasi. “Tanlash” bosilganda buyurtma yaratadi.

### 12) services/districtData.js 📄
Tuman koordinatalari va narx modeli (masofa bo‘yicha).
Keyin real narxlar kiritish oson.

### 13) services/districtApi.js 📡
Backend bilan aloqa:
- `action: "district_offers"` → haydovchi takliflari
- `action: "create_inter_district"` → buyurtma yaratish

> Muhim: Backendda bu actionlar yo‘q bo‘lsa, districtApi avtomatik fallback takliflar yaratadi
> (UI ishlashi uchun). Backendni ulash uchun api/order.js ga action qo‘shiladi.

## Integratsiya
1) Papkani proyektga nusxa ko‘chiring.
2) Route’ga qo‘shing:
```jsx
import ClientInterDistrictPage from "@/features/client/interDistrict/ClientInterDistrictPage";
```
3) apiHelper yo‘li sizda boshqacha bo‘lsa, `districtApi.js` importini moslang.
