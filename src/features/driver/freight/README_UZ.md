# Driver Freight (PRO) moduli — README (UZ)

Bu paket `src/features/driver/freight/` ichiga qo‘yiladigan **haydovchi-yuk** (freight) moduli.

## Asosiy g‘oya (UX)
Haydovchi 3 qadamda ishga tushadi:
1) **Mashina tanlash** (rasmli kartalar)  
2) **Ish rejimini tanlash** (tanlangan mashinaga mos UI)  
3) **Aktiv** → mos buyurtmalar feed’i + xarita

## Papkalar nima qiladi?

### 1) FreightPage.jsx
Modulning kirish nuqtasi. 3 qadamli flow:
- Vehicle tanlash
- Mode konfiguratsiya
- Aktiv feed (buyurtmalar)

### 2) context/
- **FreightContext.jsx**: global state + Provider + hook
- **freightReducer.js**: statuslar va eventlar:
  - `EMPTY`, `PARTIAL_LOAD`, `FULL`
  - `SET_VEHICLE`, `SET_MODE`, `SET_CAPACITY`, `SET_ROUTE`, `SET_MATERIAL`, `SET_PRICING`, ...

### 3) components/
#### modes/long-haul (Fura/Isuzu/Gazel — viloyatlararo)
- RouteBidBoard.jsx: “birja” ko‘rinishi (yuklar ro‘yxati + bid)
- TruckLoadVisual.jsx: do-zagrus (kuzov to‘lishi) vizual
- ReturnTripSetup.jsx: “ortga bo‘sh qaytmaslik” sozlamasi

#### modes/city-logistics (Labo/Damas — shahar ichi)
- HourlyRateSetup.jsx: soatlik/reyslik tarif
- MoverOption.jsx: gruzchik switch + counter
- QuickOrderMap.jsx: tez buyurtmalar xaritasi (markerlar)

#### modes/bulk-materials (Kamaz/Samosval — qum/shag‘al)
- MaterialSelector.jsx: rasmli material tanlash
- VolumePriceInput.jsx: bort/tonna narx
- QuarryLocator.jsx: karyer lokatsiya tanlash

#### shared/
- VehiclePassport.jsx: mashina parametrlari (tonna, metr, tent)
- PhotoGallery.jsx: mashina rasmlari (Upload)
- UnifiedOrdersFeed.jsx: filtrlangan buyurtmalar ro‘yxati

#### modals/
- HeavyLoadAlert.jsx: 10 tonnadan og‘ir ogohlantirish
- WeighStationInfo.jsx: tarozi info (placeholder)

### 4) hooks/
- useMaterialCalculator.js: “3 tonna qum = qancha?”
- useFreightSocket.js: real-time yuklar (Supabase bo‘lsa) + polling fallback
- useTruckFilter.js: haydovchi mashinasiga mos yuklarni ajratish

### 5) services/
- freightApi.js: server bilan aloqa (apiHelper orqali).  
  `api.post('/api/freight', { action: ... })` uslubida.

## Integratsiya
- Router’dan `FreightPage` ni chaqiring.
- `apiHelper` loyihada bo‘lishi kerak: `src/utils/apiHelper.js` (sizda bor).

Agar Supabase real-time ishlatmoqchi bo‘lsangiz:
- `src/lib/supabase.js` bo‘lishi kerak (ixtiyoriy). Bo‘lmasa ham modul ishlaydi (polling).

