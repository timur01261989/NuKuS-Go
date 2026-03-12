# UniGo 3-bosqich: Service dependency audit

Bu bosqichning maqsadi:
- qaysi frontend/service qaysi jadvaldan o‘qishini aniq belgilash
- qaysi jadvalga yozishini aniq belgilash
- core va service-primary qatlamlarni chalkashtirmaslik
- legacy jadvallardan qachon uzilishni rejalash

## 1. Driver core mapping

### Driver Dashboard
O‘qiydi:
- `profiles`
- `driver_service_settings`
- `vehicles`
- `driver_presence`

Vazifasi:
- aktiv mashina ko‘rsatish
- yoqilgan xizmatlarni ko‘rsatish
- online/offline holatini ko‘rsatish

### Haydovchi sozlamalari
O‘qiydi / yozadi:
- `driver_service_settings`
- `profiles.active_vehicle_id`
- `vehicles`
- `vehicle_change_requests`

Vazifasi:
- xizmatlarni yoqish/o‘chirish
- aktiv mashina tanlash
- yangi mashina so‘rovi yuborish

### Vehicles bo‘limi
O‘qiydi:
- `vehicles`
- `vehicle_change_requests`

Yozadi:
- `vehicle_change_requests`

---

## 2. Service mapping

### Shahar ichida
Asosiy jadval:
- `city_taxi_orders`

Driver core bilan bog‘lanadigan joy:
- driver dashboard only checks capability from `driver_service_settings`
- actual order feed reads `city_taxi_orders`

Qoidasi:
- `city_passenger` yoqilgan bo‘lsa passenger orderlar
- `city_delivery` yoqilgan bo‘lsa city delivery orderlar
- `city_freight` yoqilgan bo‘lsa city freight orderlar
- aktiv mashina sig‘imi `vehicles.max_weight_kg` va `max_volume_m3` bilan tekshiriladi

### Eltish
Asosiy jadval:
- `delivery_orders`

Bog‘lanish:
- DriverDelivery page -> `delivery_orders`
- capability source -> `driver_service_settings`
- active vehicle source -> `profiles.active_vehicle_id`, `vehicles`

### Yuk tashish
Asosiy jadvallar:
- `cargo_orders`
- `cargo_offers`
- qo‘shimcha: `cargo_feed`, `cargo_status_events`, `cargo_tracking_points`, `cargo_ratings`

Bog‘lanish:
- DriverFreight page -> `cargo_orders`, `cargo_offers`
- capability source -> `driver_service_settings`
- active vehicle source -> `vehicles`

### Tumanlararo
Asosiy jadvallar:
- `district_trips`
- `district_trip_requests`
- yordamchi: `district_bookings`, `district_routes`, `district_pitaks`

Bog‘lanish:
- InterDistrictPage -> `district_trips`, `district_trip_requests`
- capability source -> `driver_service_settings`
- active vehicle source -> `vehicles`

### Viloyatlararo
Asosiy jadvallar:
- `interprov_trips`
- `interprov_bookings`
- `inter_prov_seat_requests`
- yordamchi: `intercity_bookings`, `intercity_routes`

Bog‘lanish:
- InterProvincialPage -> `interprov_trips`, `interprov_bookings`, `inter_prov_seat_requests`
- capability source -> `driver_service_settings`
- active vehicle source -> `vehicles`

---

## 3. Frontend source of truth

### Core source of truth
Har doim shu jadvallar birinchi manba:
- `profiles`
- `driver_service_settings`
- `vehicles`
- `driver_presence`

### Service source of truth
Har bir service o‘zining service-primary jadvalidan o‘qiydi:
- city -> `city_taxi_orders`
- delivery -> `delivery_orders`
- freight -> `cargo_orders`
- interdistrict -> `district_trips`, `district_trip_requests`
- intercity -> `interprov_trips`, `interprov_bookings`, `inter_prov_seat_requests`

### Noto‘g‘ri yo‘l
Frontend service sahifalari:
- `drivers`
- `driver_profiles`
- `inter_prov_trips`
- `transactions`
- `billing_transactions`

ga to‘g‘ridan-to‘g‘ri ulanmasligi kerak.

---

## 4. Legacy cutover reja

### 4.1 drivers
Holati:
- legacy

Reja:
- frontenddan foydalanish to‘xtatiladi
- driver identity faqat `profiles` + `driver_applications` orqali olinadi

### 4.2 driver_profiles
Holati:
- legacy

Reja:
- barcha driver profile ma’lumotlari `profiles` va `driver_applications` ga ko‘chiriladi
- frontend references uziladi

### 4.3 inter_prov_trips
Holati:
- legacy duplicate

Reja:
- `interprov_trips` canonical bo‘ladi
- `inter_prov_trips` dan o‘qish to‘xtatiladi
- keyin cleanup bosqichida drop

### 4.4 transactions / billing_transactions
Holati:
- legacy wallet layer

Reja:
- wallet source faqat:
  - `wallets`
  - `wallet_transactions`
- eski transaction layer keyin auditdan so‘ng uziladi

---

## 5. Kod audit paytida qidiriladigan patternlar

Quyidagi import / query / service call lar qayerda ishlatilayotganini topish kerak:

### Legacy driver
- `from('drivers')`
- `from('driver_profiles')`

### Legacy intercity
- `from('inter_prov_trips')`

### Legacy wallet
- `from('transactions')`
- `from('billing_transactions')`

### Canonical driver core
- `from('profiles')`
- `from('driver_service_settings')`
- `from('vehicles')`
- `from('driver_presence')`

### Service primary
- `from('city_taxi_orders')`
- `from('delivery_orders')`
- `from('cargo_orders')`
- `from('cargo_offers')`
- `from('district_trips')`
- `from('district_trip_requests')`
- `from('interprov_trips')`
- `from('interprov_bookings')`
- `from('inter_prov_seat_requests')`

---

## 6. 3-bosqich natijasi

Bu bosqich tugagach:
- qaysi frontend page qaysi jadvalga qarashi aniq bo‘ladi
- qaysi legacy jadvaldan uzilish kerakligi aniq bo‘ladi
- keyingi cleanup ko‘r-ko‘rona emas, aniq dependency bo‘yicha qilinadi

---

## 7. Keyingi bosqich

4-bosqichda:
- frontend kod audit qilinadi
- legacy querylar topiladi
- canonical jadvallarga ko‘chiriladi
- keyin safe cleanup list tayyorlanadi
