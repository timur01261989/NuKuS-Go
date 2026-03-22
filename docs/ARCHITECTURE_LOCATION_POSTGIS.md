# Lokatsiya arxitekturasi (10M+ foydalanuvchi)

## Ma’lumot modeli

| Manba | Jadval | Geo maydon | Indeks |
|--------|--------|------------|--------|
| Haydovchi real-time | `driver_presence` | `location geography(Point,4326)` (trigger: `lat`/`lng`) | GiST + partial `(is_online, last_seen_at)` |
| Mijoz oxirgi nuqta | `client_last_location` | `location` (trigger) | GiST |
| Haydovchi profil (kam yangilanadi) | `drivers` | `location` (alohida sinxron kerak bo‘lsa) | GiST (mavjud) |

`lat`/`lng` API bilan mos qoladi; `location` indekslangan qatlam.

## RPC

- **`nearby_online_drivers(p_lng, p_lat, p_radius_m, p_since, p_service_type, p_limit)`** — faqat kerakli ustunlar, `ST_DWithin` + masofa tartibi. **Faqat `service_role`**.
- **`drivers_in_radius`** — endi `select *` emas, `user_id`, `last_seen`, `dist_m` qaytaradi.

## Server kod

- `server/repositories/driverPresenceRepository.js` — upsert, ro‘yxat, radius RPC.
- `server/repositories/clientLocationRepository.js` — mijoz `client_last_location`.
- `server/api/presence.js` — GET `?lat=&lng=&radius_m=` bo‘lsa PostGIS RPC, aks holda cheklangan ro‘yxat.
- `server/api/client_location.js` — mijoz joyini saqlash (POST).
- `api/routeRegistry.js` — `client_location` / `client-location` segmentlari shu handlerga ulanadi (`POST /api/client_location/...`).

## Keyingi qadamlar (prod)

1. **Partitioning** — `driver_location_snapshots` / tarixiy trace jadvallarini vaqt bo‘yicha partition qilish.
2. **Read replica** — og‘ir geo o‘qimlar uchun.
3. **Redis Geo** — sub-sekund yangilanish + PostgreSQL ga kamroq yozuv (batch).
4. **`drivers.location`** ni `driver_presence` bilan sinxron trigger yoki worker orqali yangilash (ikki manba bo‘lmasin).
