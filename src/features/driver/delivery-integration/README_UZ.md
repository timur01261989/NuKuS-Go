# 🚚 Driver Shared: Delivery Integration (PRO)

Bu modul haydovchi ilovasiga **"Pochta / Delivery"** funksiyasini bir xil tarzda ulash uchun yozilgan.

## Asosiy g'oya
- Haydovchi "📦 Pochta olaman" ni yoqadi.
- Tizim serverdan `parcels` jadvalidagi yuklarni olib keladi.
- **CITY** rejimi: faqat yaqin (radiusKm) yuklar.
- **INTERDISTRICT / INTERPROVINCIAL**: faqat yo'lingizdagi yuklar (deviation < 2km).

---

## 📁 Strukturadagi fayllar

### 🧠 context/
- `IntegrationContext.jsx` — Global holat (enabled, capacity, onlyMyRoute, parcels, filtered, onTrip...)
- `matchingReducer.js` — Action/reducer logikasi

### 🎛️ controls/
- `DeliveryModeToggle.jsx` — "Pochta olaman" switch
- `CapacitySelector.jsx` — M/L/XL tanlash
- `RouteFilter.jsx` — "Faqat mening yo'limdagilar" switch

### 📋 feed/
- `UnifiedParcelFeed.jsx` — **ENG MUHIM**: ro'yxatni ko'rsatadi, kartani tanlaydi, drawer UI
- `FeedHeader.jsx` — sarlavha + count
- `EmptyState.jsx` — yuk yo'q paytdagi ekran

### 🧩 widgets/
- `ParcelCardSmall.jsx` — shahar uchun ixcham
- `ParcelCardLarge.jsx` — trassa uchun to'liq
- `MapParcelMarker.jsx` — parcel pin svg (leafletga bog'lanmagan)

### 🛠️ actions/
- `AcceptParcelModal.jsx` — qabul qilish oynasi
- `QuickPickupFlow.jsx` — ⚡️ tez jarayon (rasm + SMS payload)
- `DropoffCodeInput.jsx` — 🔐 secure code bilan topshirish

### 🪝 hooks/
- `useParcelSocket.js` — Supabase Realtime + polling fallback
- `useRouteMatching.js` — yo'nalish mosligi (deviation) + radius
- `useEarningsAddon.js` — pochta daromadini qo'shish

### 🌐 services/
- `integrationApi.js` — `parcels` CRUD (apiHelper yoki supabase)

---

## Ulish
1) Provider:
```jsx
import { IntegrationProvider } from "@/features/driver/shared/delivery-integration";
<IntegrationProvider><YourDriverPage /></IntegrationProvider>
```

2) API konfiguratsiya:
```js
import api from "@/utils/apiHelper";
import { configureIntegrationApi } from "@/features/driver/shared/delivery-integration";
configureIntegrationApi({ apiHelper: api });
```
yoki:
```js
import { supabase } from "@/lib/supabase";
import { configureIntegrationApi } from "@/features/driver/shared/delivery-integration";
configureIntegrationApi({ supabase });
```

3) Feed:
```jsx
import { UnifiedParcelFeed } from "@/features/driver/shared/delivery-integration";
<UnifiedParcelFeed driverId={driverId} driverLoc={[lat,lng]} driverMode="CITY" supabase={supabase} />
```
