# Nukus Go — Deploy Qo'llanmasi

## 1. Supabase SQL Migratsiyalar (tartibda bajaring)

Supabase Dashboard → SQL Editor'da quyidagi tartibda:

```
1. supabase_schema.sql                (asosiy jadvallar — avval mavjud bo'lsa o'tkazib yuboring)
2. supabase_performance_indexes.sql   (indekslar + transfer_wallet_funds RPC)
3. supabase_new_tables.sql            ← YANGI: order_ratings, push_subscriptions,
                                                notifications, promo_codes, sos_tickets
4. supabase_postgis_geo_index.sql     (500+ haydovchi bo'lganda — ixtiyoriy)
```

## 2. Web Push VAPID Kalitlari

```bash
npx web-push generate-vapid-keys
```

Natijada ikkita kalit olinadi. Ularni `.env.local` va Vercel Dashboard'ga qo'shing:

| O'zgaruvchi | Qayerga |
|---|---|
| `VITE_VAPID_PUBLIC_KEY` | Frontend (Vite build) |
| `VAPID_PUBLIC_KEY` | Backend (Serverless) |
| `VAPID_PRIVATE_KEY` | Faqat Backend — frontend'ga bermang! |

## 3. web-push paketi

```bash
npm install web-push
```

## 4. Vercel Environment Variables

Vercel Dashboard → Settings → Environment Variables:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_VAPID_PUBLIC_KEY
VAPID_SUBJECT            (mailto:admin@nukusgo.uz)
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
CRON_SECRET              (tasodifiy uzun string)
AUTH_SECRET              (tasodifiy uzun string)
```

## 5. Deploy

```bash
vercel --prod
```

yoki GitHub'ga push — avtomatik deploy.

## 6. Cron Dispatch

**Vercel Pro** bo'lsa: `vercel.json`dagi `"crons"` bloki avtomatik ishlaydi.

**Bepul tier** — Supabase pg_cron:
```sql
SELECT cron.schedule(
  'nukusgo-dispatch', '* * * * *',
  $$SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/cron_dispatch',
    headers := '{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  );$$
);
```

## 7. PWA Icons (kerak)

`public/icons/` papkasida:
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)
- `badge-72.png`  (72×72 px, notification badge)

Yaratish: https://realfavicongenerator.net yoki Figma

## 8. Capacitor (Android / iOS)

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Nukus Go" "uz.nukusgo.app"
npx cap add android
npm run build
npx cap sync
npx cap open android
```

## Stack

| Qatlam | Texnologiya |
|--------|------------|
| Frontend | React + Vite + Ant Design |
| Backend | Vercel Serverless (Node.js) |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime |
| Maps | Leaflet + CartoDB |
| Push | Web Push API + VAPID |
| Auth | Supabase Auth |

---

## 9. Gamifikatsiya va AI Narxlash — Qo'shimcha Sozlamalar

### SQL tartib
```
1. supabase_schema.sql
2. supabase_performance_indexes.sql
3. supabase_new_tables.sql          (Push, Rating, Promo, SOS)
4. supabase_gamification.sql        ← YANGI: Darajalar, Missiyalar, Cashback, Surge, Tariff
```

### Gamifikatsiya admin boshqaruvi
Admin foydalanuvchisi (role='admin') quyidagi API'larni ishlatishi mumkin:

**Darajalarni tahrirlash:**
```bash
POST /api/gamification
{ "action": "admin_update_level", "caller_user_id": "...", "level_id": "...",
  "data": { "commission_rate": 0.10, "min_trips": 300 } }
```

**Missiya yaratish:**
```bash
POST /api/gamification
{ "action": "admin_create_mission", "caller_user_id": "...",
  "data": { "title": "Bayram bonusi", "target_type": "trips", "target_value": 5,
            "bonus_uzs": 100000, "valid_to": "2026-12-31" } }
```

### AI Surge sozlamalari (admin)
Surge qoidalarini qo'shish:
```bash
POST /api/pricing
{ "action": "admin_create_surge", "caller_user_id": "...",
  "data": { "name": "Bayram kuni", "rule_type": "manual", "multiplier": 1.5,
            "is_active": true, "applies_to": "all" } }
```

Tarifni o'zgartirish:
```bash
POST /api/pricing
{ "action": "admin_update_tariff", "caller_user_id": "...",
  "service_type": "standard",
  "data": { "per_km": 1400, "min_fare": 9000 } }
```

### OpenWeatherMap (ob-havo surge uchun)
1. https://openweathermap.org → bepul akkount oching
2. API key oling
3. `.env`ga qo'shing: `OPENWEATHER_API_KEY=your_key`
4. `surge_config` jadvalida `weather_codes` ustuniga OpenWeather condition code'larini kiriting

### Python AI Backend
```bash
cd python-ai
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Railway deploy: `railway up` (Procfile: `web: uvicorn app:app --host 0.0.0.0 --port $PORT`)
