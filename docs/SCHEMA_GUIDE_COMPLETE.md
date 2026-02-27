# Nukus Go — Supabase SQL Schema Qo'llanmasi

## 🎯 Jami Fayllar va Bajarilish Tartibi

Tartibi **JUDA MUHIM!** Quyidagi tartibda bajarilishi kerak:

### **1️⃣ Boshlang'ich O'rnatish (Birinchi Marta)**

```
1. supabase_min_auth_schema_FIXED.sql      — ✅ Profiles, Auth Trigger
2. supabase_schema.sql                     — ✅ Asosiy jadvallar (orders, drivers, etc)
3. supabase_gamification_schema.sql        — ✅ Haydovchi darajalari, missiyalar
4. supabase_wallet_schema.sql              — ✅ Hisoblar, tranzaksiyalar, promokodlar
5. supabase_notifications_schema.sql       — ✅ Bildirishnomalar, push, SMS, email
```

**Jami vaqt:** ≈ 5-10 daqiqa

### **2️⃣ Kelajakda (Kerak Bo'lganda)**

- **supabase_postgis_geo_index.sql** — 500+ haydovchi bo'lganda (PostGIS geo indexing)

---

## 📋 Fayllar Tavsifi

| № | Fayl | Maqsad | Jadvallar | 
|---|------|--------|-----------|
| 1 | `supabase_min_auth_schema_FIXED.sql` | Foydalanuvchi profillari va avtentifikatsiya | `profiles` |
| 2 | `supabase_schema.sql` | Asosiy biznes logika | `driver_applications`, `driver_presence`, `drivers`, `orders`, `order_offers`, `trip_booking_requests`, `order_events`, `sos_tickets`, `messages`, `traffic_zones` |
| 3 | `supabase_gamification_schema.sql` | Haydovchi reyting va bonuslar | `driver_levels`, `driver_gamification`, `daily_missions`, `mission_progress`, `client_bonuses`, `bonus_transactions` |
| 4 | `supabase_wallet_schema.sql` | Moliyaviy operatsiyalar | `wallets`, `wallet_transactions`, `promo_codes`, `promo_code_usage`, `cashback_records` |
| 5 | `supabase_notifications_schema.sql` | Bildirishnomalar | `notifications`, `push_subscriptions`, `sms_logs`, `email_logs`, `notification_preferences` |

---

## 🗂️ Jadvallar Ro'yhati (Jami 29 ta)

### **1️⃣ Avtentifikatsiya va Profil**
- `profiles` — Barcha foydalanuvchilar
- `auth.users` — Supabase auth (avtomatik)

### **2️⃣ Haydovchi Boshqaruvi**
- `driver_applications` — Haydovchi arzi
- `driver_presence` — Real-time joylashuv
- `drivers` — Haydovchi dashboard uchun

### **3️⃣ Buyurtmalar va Takliflar**
- `orders` — Asosiy order
- `order_offers` — Haydovchiga takliflar
- `order_events` — Order statusining tarix
- `trip_booking_requests` — Masofaviy sayohat bronlashlar

### **4️⃣ Chat va Habar**
- `messages` — Foydalanuvchi orasidagi xabarlar
- `sos_tickets` — Xavfsizlik muammo

### **5️⃣ Trafik va Mapping**
- `traffic_zones` — Hromat zonaları

### **6️⃣ Gamifikatsiya**
- `driver_levels` — Haydovchi darajalari (4 ta: Yangi, Tajribali, Professional, Ustalar)
- `driver_gamification` — Haydovchi statistikasi
- `daily_missions` — Kunlik vazifalar
- `mission_progress` — Missiya progresі
- `client_bonuses` — Mijoz bonusları
- `bonus_transactions` — Bonus tarixi

### **7️⃣ Moliyaviy Tizim**
- `wallets` — Foydalanuvchi hisobvaraqlari
- `wallet_transactions` — Hisob kuzatmasi
- `promo_codes` — Promokodlar
- `promo_code_usage` — Promokod foydalanish
- `cashback_records` — Cashback tarix

### **8️⃣ Bildirishnomalar**
- `notifications` — Barcha xabarlar
- `push_subscriptions` — Web push abonentlari
- `notification_preferences` — Xabar sozlamalari
- `sms_logs` — SMS xabarlar
- `email_logs` — Email xabarlar

---

## 🔐 RLS (Row-Level Security) Qo'llangan Jadvallar

Quyidagi jadvallar RLS bilan himoyalangan:

- ✅ `profiles`
- ✅ `driver_applications`
- ✅ `driver_presence`
- ✅ `drivers`
- ✅ `orders`
- ✅ `order_offers`
- ✅ `trip_booking_requests`
- ✅ `messages`
- ✅ `driver_gamification`
- ✅ `mission_progress`
- ✅ `client_bonuses`
- ✅ `bonus_transactions`
- ✅ `wallets`
- ✅ `wallet_transactions`
- ✅ `push_subscriptions`
- ✅ `notification_preferences`
- ✅ `notifications`

---

## 🚀 Funksiyalar

### 1. `public.create_profile_on_signup()`
**Maqsad:** Yangi user auth qilinganda profil yaratish

### 2. `public.sync_driver_presence_ids()`
**Maqsad:** `driver_presence` jadvalida `driver_user_id` ustunni sync qilish

### 3. `public.sync_order_offers_ids()`
**Maqsad:** `order_offers` jadvalida `driver_user_id` ustunni sync qilish

### 4. `public.find_nearby_drivers()`
**Maqsad:** Haydovchilarni joylashuvi bo'yicha qidiriladi (Haversine formulasi)
**Parametrlar:**
- `p_lat`: Enlik
- `p_lng`: Uzunlik  
- `p_radius_km`: Radiusi km
- `p_limit`: Qaytarilish soni
- `p_exclude_driver_ids`: Istisno qilinadigan haydovchilar

### 5. `public.transfer_wallet_funds()`
**Maqsad:** Xavfsiz pul o'tkazish (atomic transaction)
**Parametrlar:**
- `p_from_user_id`: Kimdan
- `p_to_user_id`: Kimga
- `p_amount_uzs`: Miqdori
- `p_description`: Tavsifi

---

## 📊 Indexlar (70+ ta)

Barcha jadvallar optimal qidiruv uchun indexlangan:
- Status indexlari
- User ID indexlari
- Timestamp indexlari
- Geolocation indexlari (lat, lng)
- Unique constraintlar

---

## 🔄 Triggers

- **on_auth_user_created** → Profile yaratish
- **trg_sync_driver_presence_ids** → Driver presence sync
- **trg_sync_order_offers_ids** → Order offers sync

---

## ⚙️ GRANTS (Ruxsatlar)

Barqa jadvallar GRANTS bilan sozlangan:
- `authenticated` users: SELECT, INSERT, UPDATE, DELETE
- `anon` users: SELECT (o'qish faqat)
- Sequences: SELECT, UPDATE

---

## 💡 Kengaytirilgan Features

### Atomic Transfer (Atomik o'tkazma)
```sql
SELECT * FROM public.transfer_wallet_funds(
  'from-user-id'::uuid,
  'to-user-id'::uuid,
  10000,
  'Sayyohlik puli'
);
```

### Nearby Drivers (Yaqin haydovchilar)
```sql
SELECT * FROM public.find_nearby_drivers(
  40.1724,   -- lat
  65.3747,   -- lng
  5.0,       -- 5 km radius
  10,        -- 10 ta haydovchi
  ARRAY[]::uuid[]
);
```

---

## ✅ Tekshiruv Ro'yhati

Bajarilgandan keyin tekshiring:

- [ ] Barcha 5 SQL fayli bajarilingan
- [ ] Xatolar yo'q
- [ ] `profiles` jadvalida o'zingiz bormi
- [ ] `wallets` jadvalida o'zingizning hisob bormi
- [ ] `notification_preferences` sozlangan
- [ ] RLS policies ishlayapti

---

## 🆘 Muammolar Yechimlar

### "Permission denied" xatosi
→ GRANTS qayta bajaring yoki `service_role` key ishlating

### "Table already exists" xatosi
→ Normal! Barcha jadvallarda `if not exists` bor

### RLS xatoligi
→ Authenticated role bilan login qiling yoki service_role key ishlating

---

## 📚 Qo'shimcha Ma'lumot

- **API Endpoints:** `/server/api/` folder'da
- **Frontend Services:** `/src/services/` folder'da
- **Database Hooks:** `/src/lib/supabase.js`

**Muallif:** Nukus Go Team  
**Oxirgi yangilash:** 2026-02-24
