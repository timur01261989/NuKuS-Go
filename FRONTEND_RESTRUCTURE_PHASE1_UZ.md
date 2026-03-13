# UniGo Frontend Restructure Phase 1

Bu paketda loyiha **bitta app** holatida qoldirildi, lekin frontend arxitekturasi quyidagicha
ajratildi:

- `src/app`
- `src/modules/client`
- `src/modules/driver`
- `src/modules/shared`
- `src/services/supabase`
- `src/services/dispatch`
- `src/services/maps`
- `src/services/wallet`
- `src/store`
- `src/constants`
- `src/i18n`

## Muhim
Eski `src/features/...` fayllar o'chirilmagan.
Yangi papkalardagi fayllar **adapter/wrapper layer** sifatida qo'shildi.
Shuning uchun mavjud ishlayotgan kodni sindirmasdan yangi struktura bo'yicha bosqichma-bosqich ko'chish mumkin.

## Bu bosqichda nimalar qilindi
1. `App.jsx` yangi `app/router/AppRouter.jsx` ga o'tkazildi.
2. Client va Driver route'lar alohida fayllarga ajratildi.
3. `modules/client/pages` va `modules/driver/pages` yaratildi.
4. `modules/client/services` va `modules/driver/services` yaratildi.
5. `src/i18n` ga til fayllari ko'chirildi.
6. Dispatch, Supabase, Maps, Wallet service layer yaratildi.

## Keyingi bosqich
- eski `src/features/client/...` kodlarni to'g'ridan to'g'ri `src/modules/client/...` ichiga ko'chirish
- eski `src/features/driver/...` kodlarni `src/modules/driver/...` ichiga ko'chirish
- shared UI va hooklarni yagona modulga standartlashtirish
