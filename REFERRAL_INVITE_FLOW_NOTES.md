# UniGo referral invite flow

## Repo ichida ishlangan qism
- `Do'stingni taklif qil` sahifasi qo'shildi: `/client/referral`
- share link route qo'shildi: `/r/:code` va `/invite/:code`
- register sahifasiga referral input qo'shildi
- invite link orqali kirilganda referral kod register formasiga avtomatik tushadi
- OTP tasdiqlangandan keyin referral kod backendga avtomatik yuboriladi
- profile sahifasiga invite CTA qo'shildi
- sidebar ichiga referral bo'limi qo'shildi
- public resolve endpoint qo'shildi: `GET /api/referral?action=resolve&code=...`
- avatar upload client-side image compression bilan yangilandi

## Flow
1. Ro'yxatdan o'tgan user `/client/referral` sahifasida o'z kodini va havolasini ko'radi.
2. `Do'stingni taklif qil` tugmasi share sheet ochadi. Share API bo'lmasa link clipboard ga nusxalanadi.
3. Taklif havolasi: `/r/{CODE}`.
4. Havola ochilganda referral context local storage ga yoziladi.
5. User register bo'lsa referral kod avtomatik biriktiriladi.
6. Register tugagach `POST /api/referral { action: 'apply' }` ishlaydi.

## Tashqi production setup talab qiladigan qism
Repo ichida app oqimi tayyor, lekin native Android/iOS install-dan keyingi verified deep link uchun tashqi release konfiguratsiya kerak:
- production domain
- Android App Links uchun `assetlinks.json`
- iOS Universal Links uchun `apple-app-site-association`
- production package signing fingerprintlari
- App Store / Play Store listing url'lari

Bu qiymatlar hozir repo ichida yo'q, shuning uchun install-dan keyingi deferred deep link 100% final qilish uchun release signing ma'lumotlari bilan alohida ulash kerak.
