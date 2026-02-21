SUPER PRO pack qo'shildi (ishlash prinsipi o'zgarmaydi):
- UI Kit: src/shared/ui/*
- Map style config: public/map/style.json + src/shared/utils/mapStyle.js
- Lottie (optional): src/shared/components/LottieView.jsx + src/shared/assets/lottie/*.json
- Feature scaffolds (o'chirilgan by default): src/features/{searchOnRoute,garage,payments}/*
- Chat adapter: src/features/chat/ChatModule.jsx
- Feature flags: src/shared/config/appConfig.js

Qanday yoqiladi:
1) Sizning menu/router ichida kerakli modulni import qiling:
   import { GarageModule } from './features/garage/GarageModule.jsx';
2) appConfig.features.garage=true qiling (ixtiyoriy).
3) Hozircha bu modullar scaffold — ulash backend keyin qilinadi.

Eslatma:
- Bu qo'shimchalar mavjud sahifalarni o'zgartirmaydi; shuning uchun build buzilmaydi.
