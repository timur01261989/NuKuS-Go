# UniGo duplicate cleanup report

Qilingan xavfsiz tozalashlar:

- `useSessionProfile` dublikat bridge fayllari olib tashlandi:
  - `src/modules/client/pages/shared/auth/useSessionProfile.js`
  - `src/modules/shared/shared/auth/useSessionProfile.js`
  - `src/shared/auth/useSessionProfile.js`
- `RootRedirect.jsx` importi canonical faylga o‘tkazildi:
  - `src/modules/shared/auth/useSessionProfile.js`
- `providers/route/index.js` uchun haqiqiy `buildRoute()` qo‘shildi.
- `route` bridge fayllari olib tashlandi:
  - `src/modules/providers/route/index.js`
  - `src/modules/client/providers/route/index.js`
  - `src/modules/client/pages/providers/route/index.js`
- `AudioPlayer` wrapper dublikatlari olib tashlandi va importlar canonical faylga o‘tkazildi.
- `imageUtils` wrapper dublikatlari olib tashlandi va importlar canonical faylga o‘tkazildi.

Canonical owner fayllar:

- `src/modules/shared/auth/useSessionProfile.js`
- `src/providers/route/index.js`
- `src/modules/shared/utils/AudioPlayer.js`
- `src/modules/shared/utils/imageUtils.js`
- `src/modules/shared/hooks/useGeoLocation.js`

Tekshiruv:

- `npm ci` o‘tdi
- `npm run build` o‘tdi

Muhim eslatma:

Bu passda faqat kod ichini ko‘rib xavfsiz dublikatlar olib tashlandi. Bir xil nomli, lekin turli biznes vazifali fayllar ko‘r-ko‘rona o‘chirilmadi.
