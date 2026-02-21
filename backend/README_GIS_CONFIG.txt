GIS LEVEL CONFIG SYSTEM (safe)
============================
Bular qo'shildi va APP ishlash prinsipini o'zgartirmaydi.

Public config (runtime, rebuildsiz o'zgartiriladi):
- public/config/routing.json
- public/config/tileserver.json
- public/config/location.json
- public/config/ui.json
- public/config/sounds.json

Code:
- src/shared/config/configService.js (loader + cache)
- src/shared/config/defaults.js (fallback)
- src/shared/config/runtimeConfig.js
- src/shared/utils/locationOptions.js
- src/services/soundService.js

Qanday ishlaydi:
- Agar config fayl bo'lmasa yoki ochilmasa => defaults ishlaydi.
- Hozircha appConfig o'zgarmaydi. Istasangiz, bir marta chaqiring:
    import { syncFeaturesFromUiConfig } from './shared/config/appConfig';
    await syncFeaturesFromUiConfig();

RoutingAdapter:
- Routing provider env bo'lmasa, routing.json dagi provider_default ishlaydi.
- Truck default paramlar routing.json dagi truck_defaults dan olinadi.

Ertaga muammo bo'lmasligi uchun:
- Yandex/GIS2 ichidan hech qanday .so yoki font ko'chirilmadi.
- Faqat 'konsepsiya' (config-driven architecture) qo'shildi.
