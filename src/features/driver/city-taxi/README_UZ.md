# Driver City Taxi moduli (Gibrid)

Bu modul 2 ta manbadan gibrid qilindi:
- `DriverTaxi.jsx` — dizayn va UI g‘oyalar (panellar, modal, karta uslubi)
- `driver_web_module` — toza logika va reducer uslubi (state/reducer/service qatlamlari)

## Papkalar va vazifalar

### 1) `CityTaxiPage.jsx`
Kirish nuqtasi. `TaxiProvider` ni ulaydi va ichki sahifani chiqaradi.

### 2) `context/`
- `TaxiProvider.jsx` — Context Provider (state/dispatch tarqatadi)
- `taxiReducer.js` — statuslar va state o‘zgarish logikasi

### 3) `hooks/`
- `useTaxiSocket.js` — buyurtmalarni kutish (polling fallback)
- `useDriverLocation.js` — GPS kuzatish + serverga yuborish
- `useOrderActions.js` — Accept/Decline/Status/Complete/Cancel
- `useEarnings.js` — daromad hisoblash (hozircha listdan)

### 4) `components/`
- `map/TaxiMap.jsx` — Leaflet xarita
- `map/MapMarkers.jsx` — driver marker (rotatsiya + smooth), pickup/dropoff, polyline
- `panels/TopStatusPanel.jsx` — online/offline + daromad vidjeti
- `panels/BottomActionPanel.jsx` — safar tugmalari
- `modals/IncomingOrderModal.jsx` — yangi buyurtma modal
- `widgets/OrderInfoCard.jsx` — manzillar
- `widgets/Taximeter.jsx` — vaqt/narx

### 5) `services/`
- `cityTaxiApi.js` — server bilan aloqa (apiHelper orqali)

### 6) `utils/`
- `geo.js` — heading smoothing + lerp + haversine
- `voice.js` — “Alisa” ovoz

## Integratsiya
Routing’da driver sahifaga quyidagicha ulang:
- `CityTaxiPage` ni kerakli route’ga import qiling, masalan:
  - `/driver/city-taxi` -> `CityTaxiPage`

## Eslatma
- Bu modul `apiHelper` (src/utils/apiHelper.js) bor deb hisoblaydi.
- Backend actionlar sizdagi `/api/order` va `/api/driver` handlerlarga mos bo‘lishi kerak.
