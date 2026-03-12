# UniGo 2-bosqich: Jadval klassifikatsiyasi va legacy ajratish

Bu bosqichning maqsadi:
- duplicate jadvallarni birdan o‘chirib yubormaslik
- qaysi jadval **core**, qaysi jadval **service-primary**, qaysi jadval **legacy** ekanini qat’iy belgilash
- frontend va backend keyingi bosqichlarda qaysi jadvallarga ulanishi kerakligini aniq qilish

## 1. Core jadvallar (asosiy yadro, saqlanadi)

Quyidagi jadvallar platformaning markaziy qatlami bo‘lib qoladi:

- profiles
- driver_applications
- driver_documents
- driver_service_settings
- vehicles
- vehicle_change_requests
- driver_presence
- wallets
- wallet_transactions
- orders
- notifications
- push_tokens
- regions
- districts

### Core jadvallar vazifasi

#### profiles
Asosiy user profili.
- `id = auth.users.id`
- `active_vehicle_id`

#### driver_applications
Haydovchi arizasi.

#### driver_documents
Haydovchi hujjatlari.

#### driver_service_settings
Haydovchi yoqqan xizmatlar:
- city_passenger
- city_delivery
- city_freight
- intercity_passenger
- intercity_delivery
- intercity_freight
- interdistrict_passenger
- interdistrict_delivery
- interdistrict_freight

#### vehicles
Haydovchi mashinalari.

#### vehicle_change_requests
Admin tasdiqli o‘zgarishlar.

#### driver_presence
Online/offline holati.

#### wallets / wallet_transactions
Balans va tranzaksiya tarixi.

#### orders
Kelajakdagi yagona universal order base.

---

## 2. Service-primary jadvallar (hozir ishlatilib turadi)

Bu jadvallar hozircha service oqimlari uchun ishlatilib turadi.
Hozir birdan `orders` ga ko‘chirmaymiz.

### Shahar ichida
- city_taxi_orders

### Eltish
- delivery_orders

### Yuk tashish
- cargo_orders
- cargo_offers
- cargo_feed
- cargo_status_events
- cargo_tracking_points
- cargo_ratings

### Tumanlararo
- district_trips
- district_trip_requests
- district_bookings
- district_routes
- district_pitaks

### Viloyatlararo
- interprov_trips
- interprov_bookings
- intercity_bookings
- intercity_routes
- inter_prov_seat_requests

---

## 3. Legacy / duplicate jadvallar (hozircha o‘chirilmaydi)

Quyidagilar duplicate yoki eski qatlam bo‘lishi ehtimoli juda yuqori:

- drivers
- driver_profiles
- inter_prov_trips
- transactions
- billing_transactions

Bular:
- hozircha turadi
- frontend to‘liq uzilmaguncha o‘chirilmaydi
- keyin cleanup bosqichida ko‘riladi

---

## 4. Har bir service uchun asosiy jadval

### Shahar ichida
Asosiy jadval:
- `city_taxi_orders`

### Eltish
Asosiy jadval:
- `delivery_orders`

### Yuk tashish
Asosiy jadvallar:
- `cargo_orders`
- `cargo_offers`

### Tumanlararo
Asosiy jadvallar:
- `district_trips`
- `district_trip_requests`

### Viloyatlararo
Asosiy jadvallar:
- `interprov_trips`
- `interprov_bookings`
- `inter_prov_seat_requests`
- `intercity_bookings`

---

## 5. Frontend uchun yo‘nalish

### Driver core faqat shu jadvallardan o‘qiydi
- profiles
- driver_service_settings
- vehicles
- driver_presence

### Service sahifalar hozircha service-primary jadvallardan o‘qiydi
- shahar ichida -> city_taxi_orders
- eltish -> delivery_orders
- yuk tashish -> cargo_orders / cargo_offers
- tumanlararo -> district_trips / district_trip_requests
- viloyatlararo -> interprov_trips / interprov_bookings / inter_prov_seat_requests

---

## 6. Nega legacy ni hozir o‘chirmaymiz

Sabablar:
- frontend hali eski jadvallarga ulangan bo‘lishi mumkin
- ayrim querylar hali eski nomlardan foydalanadi
- birdan `drop table` qilinsa ilova yiqiladi

Shu uchun bu bosqichda:
- faqat klassifikatsiya qilamiz
- comment qo‘yamiz
- keyin 3-bosqichda dependency audit qilamiz

---

## 7. 2-bosqich natijasi

Bu bosqich tugagach:
- qaysi jadval qolishi aniq bo‘ladi
- qaysi jadval legacy ekanligi aniq bo‘ladi
- keyingi frontend migration tartibli bo‘ladi
- cleanup xavfsiz bo‘ladi

---

## 8. Keyingi bosqich

3-bosqichda:
- service-by-service dependency audit qilamiz
- qaysi frontend fayl qaysi jadvalga ulanganini belgilaymiz
- keyin safe cleanup reja qilamiz
