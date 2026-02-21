OSM LEVEL SYSTEM (OsmAnd g'oyasi, xavfsiz)
====================================
Qo'shildi (buzmaydi):
- public/config/poi.json  (POI provider + categories + local sample)
- public/config/voice.json (TTS voice sozlamalari + phrase)
- src/services/poiService.js (POI search + local cache, optional Overpass)
- src/services/voiceService.js (Web Speech TTS, Uzbek)
- src/shared/config/defaults_osm.js (fallback)
- SearchOnRouteModule endi real qidiradi va natijani ko'rsatadi.

Ertaga muammo bo'lmasligi uchun:
- OsmAnd ichidan obf, fonts, native libs ko'chirilmagan.
- Faqat config-driven model + ishlaydigan sample qo'shildi.

Sozlash:
- POI online qilish: public/config/poi.json -> provider: "overpass"
- TTS: public/config/voice.json -> enabled/mode/language
