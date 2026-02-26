# UNIGO — Toliq O'rnatish va Deployment Qo'llanmasi

## 📦 Nima Bu?

**UNIGO** — O'zbekiston uchun multi-platform taksi, yuk tashish, va inter-shahar sayohat platformasi.

**Texnologiya Stack:**
- **Frontend:** React 18 + Vite + TailwindCSS + Ant Design
- **Backend:** Node.js + Vercel Functions
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase RealtimeAPI
- **Maps:** Leaflet + OpenStreetMap
- **Authentication:** Supabase Auth

---

## 🚀 Boshlang'ich O'rnatish

### **1️⃣ Muhit Sozlamasi (Development)**

#### Talabalar:
- Node.js ≥ 18.0
- npm yoki yarn
- Supabase account (supabase.com)
- Git

#### O'rnatish:

```bash
# 1. Loyihani klonlash
git clone <repo-url>
cd nukus

# 2. Dependencies o'rnatish
npm install

# 3. Environment faylini yaratish
cp .env.example .env.local

# 4. .env.local ni to'ldirish:
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxx
VITE_API_BASE_URL=http://localhost:3000
```

#### Development Server Ishga Tushirish:

```bash
# Frontend dev server (port 5173)
npm run dev

# Boshqa terminal da backend
cd server
npm install
npm start
```

**URL:** http://localhost:5173

---

## 🗄️ Supabase Sozlamasi

### **Qadam 1: Supabase Loyihasi Yaratish**

1. [supabase.com](https://supabase.com) ga kiring
2. "New project" bosin
3. Database parolini saqlab qoying
4. Loyihaning URL va Anon Key'ni nusxalang

### **Qadam 2: SQL Sxemalar Bajarilishi**

Supabase dashboard → SQL Editor → quyidagi fayllarni tartib bilan bajaring:

```
1. supabase_min_auth_schema_FIXED.sql
2. supabase_schema.sql
3. supabase_gamification_schema.sql
4. supabase_wallet_schema.sql
5. supabase_notifications_schema.sql
```

**⚠️ MUHIM:** Tartibi juda muhim!

### **Qadam 3: RLS Sozlamasi**

Supabase → Authentication → Policies → Tekshiring shu shart:

```
✅ Enable RLS on all tables
✅ Authenticated users have appropriate policies
```

### **Qadam 4: Secrets (Maxfiy Kalitlar)**

Supabase Project Settings → API → nusxalang:
- URL (public)
- Anon Key (public)
- Service Role Key (MAXFIY! Server side faqat)

---

## 🔌 Backend Sozlamasi

### **.env Fayl (Server Side)**

Backend `/server` papkasida `.env` yaratish:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxx
SUPABASE_ANON_KEY=xxxxxxxxxxxxx

# Web Push (optional)
VAPID_SUBJECT=mailto:admin@nukusgo.uz
VAPID_PUBLIC_KEY=xxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxx

# SMS Provider (optional)
TWILIO_ACCOUNT_SID=xxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE=+xxxxxxx

# Email Provider (optional)
SENDGRID_API_KEY=xxxxxxxxxxxxx
```

### **Backend Dependencies:**

```bash
cd server
npm install web-push dotenv cors express
```

---

## 📱 Frontend Sozlamasi

### **.env.local Fayl**

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxx
VITE_API_BASE_URL=https://api.nukusgo.uz
VITE_APP_VERSION=1.0.0
VITE_GOOGLE_MAPS_KEY=xxxxxxxxxxxxx (optional)
```

### **Konfiguratsiya Fayllar**

`/public/config` da JSON fayllar:
- `market.json` — Bozor sozlamasi
- `tariffs.json` — Tariffalar
- `ui.json` — UI sozlamasi
- `sounds.json` — Audio fayllar
- `voice.json` — Ovoz sozlamasi

---

## 🏗️ Arxitektura

```
nukus/
├── src/                           # Frontend React app
│   ├── features/                  # Business logic modules
│   │   ├── auto-market/           # Auto savdo
│   │   ├── client/                # Mijozlar uchun
│   │   │   ├── taxi/
│   │   │   ├── delivery/
│   │   │   ├── freight/
│   │   │   └── intercity/
│   │   └── driver/                # Haydovchilar uchun
│   │       ├── city-taxi/
│   │       ├── freight/
│   │       └── inter-provincial/
│   ├── services/                  # API services
│   ├── hooks/                     # React hooks
│   ├── pages/                     # Pages
│   └── App.jsx
├── server/                        # Backend Node.js
│   ├── api/                       # API endpoints
│   │   ├── auth.js
│   │   ├── dispatch.js
│   │   ├── driver.js
│   │   ├── order.js
│   │   ├── wallet.js
│   │   ├── gamification.js
│   │   └── notifications.js
│   └── _shared/                   # Shared helpers
├── public/                        # Static files
│   ├── config/                    # JSON configurations
│   ├── sounds/                    # Audio files
│   └── icons/
├── docs/                          # Documentation
├── supabase*.sql                  # Database schemas
└── package.json
```

---

## 🔐 RLS va Security

### **Security Principles:**

1. **RLS Enabled** — Barcha muhim jadvallar
2. **Service Role Key** — Server side faqat
3. **Anon Key** — Frontend uchun limited
4. **CORS** — Faqat allowed origins
5. **Rate Limiting** — API endpoints da

### **RLS Policies Misoli:**

```sql
-- Foydalanuvchi o'z profilini ko'rishi mumkin
create policy "users_see_own_profile"
on profiles for select
to authenticated
using (id = auth.uid());

-- Haydovchi o'z buyurtmalarini ko'rishi mumkin
create policy "drivers_see_own_orders"
on orders for select
to authenticated
using (driver_id = auth.uid() or passenger_id = auth.uid());
```

---

## 🧪 Testing

### **Frontend Testing:**

```bash
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint check
```

### **Database Testing:**

Supabase SQL Editor da:

```sql
-- Profiles tekshirish
SELECT count(*) FROM public.profiles;

-- Online haydovchilar
SELECT * FROM public.driver_presence WHERE is_online = true;

-- Bugungi buyurtmalar
SELECT count(*) FROM public.orders 
WHERE DATE(created_at) = CURRENT_DATE;
```

---

## 📦 Production Deployment

### **Frontend Deployment (Vercel)**

```bash
# Vercel CLI o'rnatish
npm i -g vercel

# Vercel ga deploy
vercel

# Production build
npm run build
```

**vercel.json** allaqachon mo'ljallangan.

### **Backend Deployment (Vercel Functions)**

Backend `/server/api` da Vercel Functions uchun mo'ljallangan:

```bash
# Vercel Functions deploy
vercel deploy --prod
```

### **Database Backup**

Supabase Dashboard:
```
Settings → Backups → Enable daily backups
```

---

## 🚨 Common Issues va Yechimlar

### **1. "Cannot find Supabase"**
```bash
# Tekshiring .env fayllarini
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

### **2. RLS Permission Denied**
```sql
-- Service role bilan bajaring yoki:
-- Grant permissions qayta bajarilsin
GRANT SELECT, INSERT ON public.orders TO authenticated;
```

### **3. CORS Xatosi**
```javascript
// server/_shared/cors.js tekshiring
res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
```

### **4. Database Connection Timeout**
- Supabase database connection limit: 100
- Pool connections: 40 recommended
- Timeout: 180 seconds

---

## 📊 Monitoring

### **Supabase Metrics:**

1. **Database Size** — Project settings
2. **Function Usage** — Database → Usage
3. **API Requests** — Logs → Auth
4. **Realtime Connections** — Realtime Status

### **Application Metrics:**

```javascript
// Frontend performance
navigator.performance.measure('app-init')
console.log(performance.getEntriesByType('measure'))
```

---

## 🔄 Regular Maintenance

### **Weekly:**
- [ ] Backup check
- [ ] Error logs review
- [ ] Performance metrics

### **Monthly:**
- [ ] Database optimization
- [ ] Index analysis
- [ ] Disk space check

### **Quarterly:**
- [ ] Security audit
- [ ] Dependency updates
- [ ] Load testing

---

## 📚 Foydalanuvchi Hujjatlari

### **Mijozlar (Clients):**
- Taksi buyurtmasi
- Yuk tashish (Delivery)
- Inter-shahar sayohat
- Bonus va cashback

### **Haydovchilar (Drivers):**
- Taksi xizmati
- Yuk tashish
- Inter-shahar route
- Darajalar va missiyalar

### **Admin:**
- Foydalanuvchi boshqaruvi
- Tariff sozlamasi
- Promo codes
- Reports

---

## 💬 Support

- **Issues:** GitHub Issues
- **Docs:** `/docs` folder
- **Email:** support@nukusgo.uz
- **Telegram:** @nukusgo_support

---

## 📝 Versioning

**Hozirgi versiya:** 1.0.0

**Semantic Versioning:**
- MAJOR: API changes
- MINOR: New features
- PATCH: Bug fixes

---

## ⚖️ License

Proprietary — UniGo Team

---

## 🎉 Muvaffaq O'rnatish!

Barcha qadamni bajarilgandan keyin:

```bash
✅ npm install — Dependencies o'rnatildi
✅ .env.local — Environment variables
✅ SQL schemas — Database yaratildi
✅ npm run dev — Frontend ishga tusha
✅ http://localhost:5173 — Ochiq!
```

**Birinchi buyurtmani qiling! 🚗**

---

**Muallif:** UniGo Team  
**Oxirgi update:** 2026-02-24
