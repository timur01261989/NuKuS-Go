# Auto Market to'lov tizimi — sozlash (UZ)

Bu hujjat **faqat Avto Savdo** (Auto Market) bo'limidagi to'lovlarni ishga tushirish uchun.

## 1) Supabase SQL
Supabase SQL Editor'da ketma-ket ishga tushiring:

1) `supabase_min_auth_schema_FIXED.sql` (agar hali bo'lmasa)
2) `supabase_wallet_schema.sql` (wallets + wallet_transactions)
3) `sql/auto_market_schema.sql` (auto ads)
4) `sql/auto_market_payments_addon.sql` (payments + promo + reveal)

## 2) Supabase Storage
Dashboard → Storage → **Create bucket**:
- bucket: `auto-market`
- access: **public** (MVP uchun)

## 3) Vercel ENV (SERVER)
Vercel → Project → Settings → Environment Variables:

Majburiy:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Narxlar (ixtiyoriy, qo'ymasangiz default ishlaydi):
- `AUTO_MARKET_REVEAL_PHONE_PRICE_UZS`  (default 5000)
- `AUTO_MARKET_TOP_1DAY_PRICE_UZS`      (default 15000)
- `AUTO_MARKET_TOP_3DAY_PRICE_UZS`      (default 35000)
- `AUTO_MARKET_VIP_7DAY_PRICE_UZS`      (default 50000)
- `AUTO_MARKET_RAISE_PRICE_UZS`         (default 8000)

Payme (ixtiyoriy):
- `PAYME_MERCHANT_ID`
- `PAYME_SECRET` (keyin callback signature tekshiruv uchun)

Click (ixtiyoriy):
- `CLICK_SERVICE_ID`
- `CLICK_MERCHANT_ID`
- `CLICK_SECRET_KEY`

Cron (ixtiyoriy):
- `AUTO_MARKET_CRON_SECRET`

## 4) Vite ENV (CLIENT)
Local / Vercel front:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`

Misol:
- `VITE_API_BASE_URL=https://<project>.vercel.app/api`

## 5) Qanday ishlaydi
### Balans to'ldirish
Auto Market → `TopUpPage`:
- provider `demo` → balans darhol to'ladi
- provider `payme/click` → `payment_url` ochiladi (skeleton)

### Pullik actionlar
1) Contact reveal: `POST /api/auto-market/contact/reveal`
2) Promo: `POST /api/auto-market/promo/buy`

## 6) Payme/Click “to'liq” qilish
Hozirgi buildda Payme/Click **invoice + redirect URL** qaytaradi.
To'liq production uchun siz:

1) Payme/Click cabinetda callback URL'larni sozlaysiz
2) Callback endpointlarni yoqasiz (default OFF):
   - `ENABLE_PAYME_CALLBACK=true`
   - `ENABLE_CLICK_CALLBACK=true`
3) Provider hujjatiga mos qilib signature/credential tekshiruvni qo'shasiz:
   - server: `server/api/auto_market.js` ichida `verifyPaymeCallback()` va `verifyClickCallback()`
4) Callback verified bo'lsa — `auto_payments.status=paid` + wallet credit bo'ladi

### Callback URL'lar (skeleton tayyor)
- Payme: `POST /api/auto-market/payment/callback/payme`
- Click: `POST /api/auto-market/payment/callback/click`

> Eslatma: hozircha verify skeleton. Shartnoma bo'lganda hujjatdagi exact sign rules bilan to'ldirasiz.

> Contract bo'lmaguncha `demo` provider bilan MVP yuradi.

## 6) Provider avtomatik tanlash (DEMO → Payme/Click)
`/api/auto-market/payment/create` endpointida **provider** avtomatik tanlanadi:

- Agar `PAYME_MERCHANT_ID` va `PAYME_SECRET` mavjud bo'lsa → `payme`
- Aks holda, agar `CLICK_SERVICE_ID` va `CLICK_SECRET_KEY` mavjud bo'lsa → `click`
- Aks holda → `demo`

Agar siz `provider` ni body'da aniq yuborsangiz (`payme|click|demo`), server o'shani ishlatadi.
Payme/Click env yo'q bo'lsa, server `400` qaytaradi.

### DEMO xavfsizlik
DEMO productionda tasodifan yoqilib ketmasligi uchun:

- Production (Vercel): `DISABLE_DEMO_PAYMENTS=true` (tavsiya)
- Agar baribir productionda demo kerak bo'lsa (tavsiya emas): `ALLOW_DEMO_PAYMENTS_IN_PROD=true`

## 7) Payme/Click keylari kelganda nima qilasiz (kodga tegmaysiz)
1) Vercel ENV qo'ying:
   - Payme: `PAYME_MERCHANT_ID`, `PAYME_SECRET`
   - Click: `CLICK_SERVICE_ID`, `CLICK_SECRET_KEY` (va ixtiyoriy `CLICK_MERCHANT_ID`)
2) Callback yoqing:
   - `ENABLE_PAYME_CALLBACK=true` va/yoki `ENABLE_CLICK_CALLBACK=true`
3) Provider cabinetda callback URL'ni shu endpointga qo'ying.
4) `verifyPaymeCallback()` / `verifyClickCallback()` ichiga hujjat bo'yicha signature tekshiruvni qo'shing.
