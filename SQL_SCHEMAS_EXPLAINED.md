# Supabase SQL Schemas — Toliq Tushuntirish

## 📂 SQL Fayllar

### **1. supabase_min_auth_schema_FIXED.sql** ⭐ BIRINCHI

**Maqsad:** Foydalanuvchi profillari va autentifikatsiya

**Jadvallar:**
- `profiles` — Barcha foydalanuvchilar (200 qatorli misol)

**Funksiyalar:**
- `create_profile_on_signup()` — Auth trigger

**Qollanish:**
```sql
-- Yangi user registratsiya
INSERT INTO public.profiles (id, full_name, phone, role)
VALUES ('user-uuid', 'John Doe', '+998901234567', 'driver');

-- Profilni ko'rish
SELECT * FROM public.profiles WHERE id = auth.uid();
```

---

### **2. supabase_schema.sql** ⭐ IKKINCHI

**Maqsad:** Asosiy bisnes logika jadvallar

**Jadvallar:** 10 ta

#### **2.1 driver_applications** (Haydovchi arzi)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "status": "pending|approved|rejected",
  "documents": {"license": "file", "insurance": "file"},
  "rejection_reason": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Qollanish:**
```sql
-- Arzi yuborish
INSERT INTO public.driver_applications (user_id, documents, status)
VALUES ('user-uuid', '{"license": "url", "insurance": "url"}', 'pending');

-- Arzini tekshirish
SELECT status FROM public.driver_applications 
WHERE user_id = 'user-uuid';
```

---

#### **2.2 driver_presence** (Real-time joylashuv)
```json
{
  "driver_id": "uuid",
  "is_online": true,
  "lat": 40.1724,
  "lng": 65.3747,
  "heading": 45.5,
  "speed": 30.2,
  "updated_at": "timestamp"
}
```

**Qollanish:**
```sql
-- Haydovchining joylashuvini yangilash
UPDATE public.driver_presence 
SET lat = 40.1724, lng = 65.3747, is_online = true
WHERE driver_id = 'driver-uuid';

-- Online haydovchilarni topish
SELECT * FROM public.find_nearby_drivers(40.1724, 65.3747, 5.0, 10);
```

---

#### **2.3 drivers** (UI dashboard uchun)
```json
{
  "user_id": "uuid",
  "is_online": true,
  "lat": 40.1724,
  "lng": 65.3747,
  "last_seen_at": "timestamp"
}
```

---

#### **2.4 orders** (Asosiy order jadval)
```json
{
  "id": "uuid",
  "passenger_id": "uuid",
  "driver_id": "uuid",
  "service_type": "taxi|delivery|freight|inter_prov",
  "status": "searching|offered|accepted|completed",
  "price": 50000,
  "pickup": {"lat": 40.1, "lng": 65.3, "name": "Home"},
  "dropoff": {"lat": 40.2, "lng": 65.4, "name": "Office"},
  "created_at": "timestamp"
}
```

**Qollanish:**
```sql
-- Yangi buyurtma
INSERT INTO public.orders (passenger_id, service_type, pickup, dropoff)
VALUES ('pass-uuid', 'taxi', '{"lat":40.1,"lng":65.3}', '{"lat":40.2,"lng":65.4}');

-- Buyurtma statusini chasqatish
SELECT status FROM public.orders WHERE id = 'order-uuid';

-- Barcha buyurtmalar
SELECT * FROM public.orders WHERE passenger_id = auth.uid();
```

---

#### **2.5 order_offers** (Haydovchilar uchun teklif queue)
```json
{
  "id": "uuid",
  "order_id": "uuid",
  "driver_id": "uuid",
  "status": "sent|accepted|rejected|expired",
  "sent_at": "timestamp",
  "expires_at": "timestamp"
}
```

**Qollanish:**
```sql
-- Haydovchiga teklif yuborish
INSERT INTO public.order_offers (order_id, driver_id, expires_at)
VALUES ('order-uuid', 'driver-uuid', now() + interval '30 seconds');

-- O'z tekliflarni ko'rish
SELECT * FROM public.order_offers 
WHERE driver_id = 'driver-uuid' AND status = 'sent';
```

---

#### **2.6 trip_booking_requests** (Inter-shahar bronlash)
```json
{
  "id": "uuid",
  "order_id": "uuid",
  "passenger_id": "uuid",
  "seats_booked": 2,
  "status": "pending|accepted|rejected"
}
```

---

#### **2.7 order_events** (Order tarix)
```json
{
  "id": "uuid",
  "order_id": "uuid",
  "event_type": "created|offered|accepted|started|completed",
  "event_data": {"note": "Haydovchi keldi"},
  "created_at": "timestamp"
}
```

---

#### **2.8 sos_tickets** (Xavfsizlik)
```json
{
  "id": "uuid",
  "order_id": "uuid",
  "user_id": "uuid",
  "ticket_type": "unsafe_driver|unsafe_passenger|accident|medical",
  "status": "open|investigating|resolved",
  "created_at": "timestamp"
}
```

---

#### **2.9 messages** (Chat)
```json
{
  "id": "uuid",
  "order_id": "uuid",
  "sender_id": "uuid",
  "recipient_id": "uuid",
  "message_text": "string",
  "is_read": false,
  "created_at": "timestamp"
}
```

---

#### **2.10 traffic_zones** (Hromat zonaları)
```json
{
  "id": "uuid",
  "name": "City Center",
  "zone_geom": {"coords": [[40.1, 65.3], [40.2, 65.4]]},
  "severity": "low|medium|high"
}
```

---

### **3. supabase_gamification_schema.sql** ⭐ UCHINCHI

**Maqsad:** Haydovchi darajalari va missiyalar

**Jadvallar:** 6 ta

#### **3.1 driver_levels** (4 ta standart daraja)
```json
{
  "id": "uuid",
  "name": "Yangi|Tajribali|Professional|Ustalar",
  "min_trips": 0,
  "min_rating": 0,
  "commission_rate": 0.15,
  "sort_order": 1
}
```

**Standart Darajalar:**
- **Yangi** — 0 sayohat, 0 rating
- **Tajribali** — 50 sayohat, 4.0 rating
- **Professional** — 200 sayohat, 4.5 rating
- **Ustalar** — 500 sayohat, 4.8 rating

---

#### **3.2 driver_gamification** (Haydovchi statistikasi)
```json
{
  "driver_id": "uuid",
  "level_name": "Yangi",
  "total_trips": 150,
  "total_earnings_uzs": 5000000,
  "bonus_points": 1250,
  "streak_days": 7,
  "rating": 4.7
}
```

---

#### **3.3 daily_missions** (Kunlik vazifalar)
```json
{
  "id": "uuid",
  "title": "10 ta sayohat",
  "target_type": "trips|earnings|distance",
  "target_value": 10,
  "bonus_uzs": 100000,
  "bonus_points": 100,
  "is_active": true,
  "valid_from": "2026-02-24",
  "valid_to": null
}
```

**Misol vazifalar:**
- 10 ta sayohat → 100,000 so'm bonus
- 500 km masofani yo'q → 50,000 so'm bonus
- 1,000,000 so'm daromad → 150,000 so'm bonus

---

#### **3.4 mission_progress** (Missiya progresі)
```json
{
  "mission_id": "uuid",
  "driver_id": "uuid",
  "date": "2026-02-24",
  "current_value": 7,
  "completed": false,
  "rewarded": false
}
```

---

#### **3.5 client_bonuses** (Mijoz bonusları)
```json
{
  "user_id": "uuid",
  "points": 5000,
  "total_earned": 10000,
  "total_spent": 5000
}
```

---

#### **3.6 bonus_transactions** (Bonus tarixi)
```json
{
  "user_id": "uuid",
  "kind": "earn|spend|refund",
  "points": 100,
  "uzs_value": 100,
  "order_id": "uuid",
  "created_at": "timestamp"
}
```

---

### **4. supabase_wallet_schema.sql** ⭐ TO'RTINCHI

**Maqsad:** Moliyaviy operatsiyalar

**Jadvallar:** 5 ta

#### **4.1 wallets** (Foydalanuvchi hisobvaraqlari)
```json
{
  "user_id": "uuid",
  "balance_uzs": 500000,
  "total_topup_uzs": 1000000,
  "total_spent_uzs": 500000,
  "frozen_uzs": 0
}
```

**Qollanish:**
```sql
-- Hisob balansini ko'rish
SELECT balance_uzs FROM public.wallets WHERE user_id = 'user-uuid';

-- Yangi hisob yaratish
INSERT INTO public.wallets (user_id, balance_uzs)
VALUES ('user-uuid', 0);

-- Pul o'tkazish (atomic)
SELECT * FROM public.transfer_wallet_funds(
  'from-user-uuid'::uuid,
  'to-user-uuid'::uuid,
  10000,
  'Sayyohlik puli'
);
```

---

#### **4.2 wallet_transactions** (Hisob kuzatmasi)
```json
{
  "user_id": "uuid",
  "amount_uzs": 10000,
  "kind": "topup|spend|cashback|bonus|refund",
  "description": "Taksi zaraiti",
  "order_id": "uuid",
  "created_at": "timestamp"
}
```

---

#### **4.3 promo_codes** (Promokodlar)
```json
{
  "code": "WELCOME2026",
  "discount_type": "fixed|percent",
  "discount_value": 50000,
  "max_uses": 100,
  "used_count": 45,
  "valid_from": "2026-01-01",
  "valid_to": "2026-12-31"
}
```

**Misol Promokodlar:**
- `WELCOME2026` — 50,000 so'm skidka
- `SUMMER50` — 50% chegirma (max 100,000 so'm)
- `REFER100` — 100,000 so'm bonus

---

#### **4.4 promo_code_usage** (Promokod foydalanish)
```json
{
  "promo_code_id": "uuid",
  "user_id": "uuid",
  "order_id": "uuid",
  "discount_uzs": 50000,
  "used_at": "timestamp"
}
```

---

#### **4.5 cashback_records** (Cashback tarix)
```json
{
  "user_id": "uuid",
  "order_id": "uuid",
  "cashback_uzs": 5000,
  "cashback_rate": 0.01,
  "status": "pending|credited|declined"
}
```

**Cashback nisbatlari:**
- Standard: 1% (5,000 so'm uchun 50 so'm)
- Comfort: 2% (5,000 so'm uchun 100 so'm)
- Freight: 0% (bonus yok)

---

### **5. supabase_notifications_schema.sql** ⭐ BESHINCHI

**Maqsad:** Bildirishnomalar, push, SMS, email

**Jadvallar:** 5 ta

#### **5.1 notifications** (Barcha xabarlar)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Yangi buyurtma",
  "body": "Haydovchi tasdiqlandi",
  "action_url": "/order/123",
  "notif_type": "order|promo|system",
  "is_read": false,
  "created_at": "timestamp"
}
```

**Xabar turlari:**
- `order` — Buyurtma haqida
- `promo` — Promoda haqida
- `system` — Tizim xabarlari
- `driver` — Haydovchi uchun
- `payment` — Pul haqida

---

#### **5.2 push_subscriptions** (Web Push)
```json
{
  "user_id": "uuid",
  "endpoint": "https://...",
  "p256dh": "key",
  "auth": "key",
  "is_active": true
}
```

---

#### **5.3 sms_logs** (SMS tarix)
```json
{
  "user_id": "uuid",
  "phone_number": "+998901234567",
  "message_text": "Taksi kelmoqda...",
  "sms_type": "verification|otp|notification",
  "status": "pending|sent|failed",
  "sent_at": "timestamp"
}
```

---

#### **5.4 email_logs** (Email tarix)
```json
{
  "user_id": "uuid",
  "email_address": "user@example.com",
  "subject": "Buyurtma tasdiqlandi",
  "email_type": "verification|receipt|notification",
  "status": "pending|sent|bounced",
  "sent_at": "timestamp"
}
```

---

#### **5.5 notification_preferences** (Sozlamalar)
```json
{
  "user_id": "uuid",
  "push_enabled": true,
  "sms_enabled": true,
  "email_enabled": true,
  "quiet_hours_enabled": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00"
}
```

---

## 🔄 Atomik Funktsiyalar

### **transfer_wallet_funds()**

```sql
SELECT * FROM public.transfer_wallet_funds(
  'from-uuid'::uuid,
  'to-uuid'::uuid,
  10000,
  'Payment for order'
);
```

**Nima qiladi:**
1. ✅ Sender hisob tekshiriladi
2. ✅ Mablag' mavjudligini tekshiriladi
3. ✅ Sender hisobdan chiqariladi
4. ✅ Receiver hisobga qo'shiladi
5. ✅ 2 ta transaction yaratiladi
6. ✅ Atomik (eski yoki barcha emas)

---

### **find_nearby_drivers()**

```sql
SELECT * FROM public.find_nearby_drivers(
  40.1724,       -- lat
  65.3747,       -- lng
  5.0,           -- 5 km radiusi
  10,            -- 10 ta haydovchi
  ARRAY[]::uuid[]  -- exclude
);
```

**Nima qiladi:**
1. ✅ Haydovchilarni bounding box bilan qidiriladi
2. ✅ 25 sekundan keyingi online haydovchilar
3. ✅ Haversine formulasi bilan masofa hisoblash
4. ✅ Radiusda bo'lganlarni qaytarish
5. ✅ Masofaga ko'ra saralash

---

## 📊 Jadvalllar O'rtasidagi Munosabatlar

```
profiles (4 ta foydalanuvchi turlari: client, driver, admin)
    ↓
driver_applications (haydovchi arzi)
driver_presence (real-time location)
drivers (dashboard)
driver_gamification (statistika)
    ↓
orders (asosiy buyurtma)
    ↓
order_offers (haydovchilar uchun teklif)
order_events (tarix)
messages (chat)
sos_tickets (xavfsizlik)
    ↓
wallets (hisoblar)
wallet_transactions (kuratkuzatma)
cashback_records (cashback)
    ↓
notifications (xabarlar)
push_subscriptions (web push)
notification_preferences (sozlamalar)
```

---

## ✅ Tekshiruv SQL

```sql
-- Barcha jadvallarni topish
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Profiles tekshirish
SELECT count(*) FROM public.profiles;

-- Online haydovchilar
SELECT count(*) FROM public.driver_presence WHERE is_online = true;

-- Bugungi buyurtmalar
SELECT count(*) FROM public.orders 
WHERE DATE(created_at) = CURRENT_DATE;

-- Wallet statistikasi
SELECT sum(balance_uzs) FROM public.wallets;

-- Gamification levels
SELECT * FROM public.driver_levels ORDER BY sort_order;
```

---

## 🎯 Xulosa

- ✅ 29 ta jadval
- ✅ 70+ index
- ✅ 20+ function va trigger
- ✅ RLS policies
- ✅ Atomic operations
- ✅ Full documentation

**Ishlashga tayyor! 🚀**

---

**Version:** 1.0.0  
**Last Update:** 2026-02-24
