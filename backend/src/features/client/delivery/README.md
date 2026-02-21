# Delivery moduli (Kuryer / Dostavka) — O‘zbekcha README

Yo‘l: `src/features/delivery/`

Bu modul Yandex Go / InDriver darajasidagi **kuryer** (yetkazib berish) oqimini beradi:
- A nuqta: olib ketish (pickup)
- B nuqta: topshirish (drop)
- Masofa -> narx
- Parcel type (hujjat/kalit/quti/gul)
- Og‘irlik kategoriyasi
- Kim to‘laydi (yuboruvchi yoki oluvchi)
- Eshikkacha (door-to-door) + qo‘shimcha narx
- Foto (yukni rasmga olish)
- Secure code (4 xonali kod) — begona odamga bermaslik uchun

> Eslatma: Telefon kontaktlariga kirish brauzerda cheklangan bo‘lishi mumkin. `useContacts` mavjud API bo‘lsa ishlatadi, bo‘lmasa fallback ro‘yxat beradi.

---

## Papka tuzilmasi

### `DeliveryPage.jsx` ⭐
Asosiy kirish nuqtasi: setup → searching → active bosqichlarini ko‘rsatadi.

### `map/*` 🗺
- `DeliveryMap.jsx` — xarita, markaz pin, pickup/drop tanlash
- `CourierMarker.jsx` — kuryer marker (rotatsiya + silliq harakat)
- `RoutePolyline.jsx` — yo‘l chizig‘i (OSRM, fallback)

### `components/Setup/*`
- `SenderForm.jsx` — yuboruvchi: telefon, podyezd, kvartira
- `ReceiverForm.jsx` — oluvchi: ism, telefon (kontaktlardan tanlash)
- `ParcelTypeChips.jsx` — rasmli chiplar: hujjat/kalit/quti/gul
- `WeightSelector.jsx` — og‘irlik: <1kg, 5kg, 10kg, 20kg+
- `PhotoUploader.jsx` — yukni rasmga olish (mijoz tomondan)

### `components/Options/*` ⚙️
- `DoorToDoorToggle.jsx` — eshikkacha + narx
- `WhoPaysSwitch.jsx` — kim to‘laydi
- `CommentInput.jsx` — kuryerga izoh

### `components/Active/*` 🚀
- `CourierInfoCard.jsx` — kuryer info
- `StatusTimeline.jsx` — statuslar
- `PinCodeDisplay.jsx` — maxfiy kod ko‘rsatish (mijozga)

### `hooks/*`
- `useDeliveryState.js` — bosqichlar (setup/searching/active), status mapping
- `useDeliveryPrice.js` — masofa + og‘irlik + eshikkacha → narx
- `useContacts.js` — kontaktlardan raqam tanlash (agar bo‘lsa)

### `services/deliveryApi.js` 📡
API so‘rovlar (default: `apiHelper` orqali).
Action nomlarini backendga moslab o‘zgartirasiz.

Qo‘shimcha:
- `delivery_schema.sql` — Supabase jadval sxemasi (SQL)
- `delivery_backend_example.js` — server handler namunasi (pseudo)

---

## Backend (Supabase) jadvali

`services/delivery_schema.sql` ichida:
- `delivery_orders` jadvali
- kerakli ustunlar (siz yozgan ro‘yxat bo‘yicha)

---

## Integratsiya
1) `DeliveryPage.jsx` ni routingga ulang (masalan: `/delivery`)
2) Paketlar:
   - `antd`
   - `leaflet`, `react-leaflet`
3) Sizda `src/utils/apiHelper.js` mavjud bo‘lishi kerak.

---

## Statuslar
- `searching` — kuryer qidirilmoqda
- `pickup` — kuryer olib ketishga keldi / oldi
- `delivering` — yo‘lda
- `completed` — topshirildi
- `cancelled` — bekor qilindi

