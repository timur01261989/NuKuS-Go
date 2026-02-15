
# Market Moduli (Auto Market) — Uzbek README

Bu modul `src/features/market/` ichida joylashadi va **Auto Market** (e’lonlar bozori) funksiyasini beradi:
- E’lonlar feedi (qidiruv, filtr, saralash)
- E’lon detal sahifasi (rasmlar, meta, sotuvchi)
- Saqlanganlar (Favorites)
- E’lon yaratish wizard (5 qadam)
- E’lonlarim (My Ads)
- Profil (demo)

> Backend bo‘lmasa ham UI ishlashi uchun `services/marketApi.js` ichida **localStorage mock** bor.

## Fayllar nima qiladi?

### ⭐ Kirish (Entry/Router)
- `MarketEntry.jsx` — modul kirish nuqtasi. Router ichiga qo‘shasiz:  
  `/<Route path="/market/*" element={<MarketEntry/>} />`
- `MarketRouter.jsx` — market sahifalari uchun routing.

### 🧠 Context
- `context/MarketFilterContext.jsx` — filtrlar state (qidiruv, shahar, brend, narx, yil, obmen, kredit, sort).
- `context/CreateAdContext.jsx` — e’lon yaratish wizard state + step.

### 🧩 Layouts
- `layouts/MarketLayout.jsx` — pastda tabbar bilan umumiy layout.
- `layouts/BackNavLayout.jsx` — back button + header bilan layout (detal/search/create uchun).

### 🧩 Components
**Common**
- `components/Common/MarketHeader.jsx` — yuqori header (back bilan).
- `components/Common/MarketTabBar.jsx` — pastdagi tabbar.
- `components/Common/SearchBar.jsx` — qidiruv input (context bilan bog‘langan).
- `components/Common/EmptyState.jsx` — bo‘sh holat UI.
- `components/Common/LoadingSkeleton.jsx` — loading skeleton.

**Feed**
- `components/Feed/TopPromo.jsx` — promo banner.
- `components/Feed/CategoriesRow.jsx` — kategoriya “chip”lari (demo).
- `components/Feed/AdsGrid.jsx` — grid + infinite scroll sentinel.
- `components/Feed/AdCard.jsx` — bitta e’lon kartasi + fav tugma.

**Details**
- `components/Details/PhotosCarousel.jsx` — rasm slider.
- `components/Details/AdMeta.jsx` — e’lon meta (narx, parametrlar).
- `components/Details/SellerCard.jsx` — sotuvchi kartasi (aloqa, chat, share).
- `components/Details/SimilarAds.jsx` — o‘xshash e’lonlar (demo).

**Filters**
- `components/Filters/FilterButton.jsx` — filtr tugmasi.
- `components/Filters/FiltersDrawer.jsx` — pastdan chiqadigan filtr drawer.
- `components/Filters/SortChips.jsx` — saralash chip’lari.

**Create (Wizard)**
- `components/Create/*` — 5 qadam: asosiy, parametr, narx, rasm, kontakt.
- `components/Create/CreateFooter.jsx` — “Orqaga/Keyingi/Yaratish” footer.

**MyAds**
- `components/MyAds/MyAdCard.jsx` — e’lonlarim kartasi.
- `components/MyAds/MyAdsTabs.jsx` — aktiv/arxiv segment.
- `components/MyAds/EmptyMyAds.jsx` — bo‘sh holat.

### 📄 Pages
- `pages/MarketHome.jsx` — feed.
- `pages/MarketSearch.jsx` — qidiruv sahifa.
- `pages/AdDetails.jsx` — e’lon detal.
- `pages/Favorites.jsx` — saqlanganlar.
- `pages/MyAds.jsx` — e’lonlarim.
- `pages/CreateAdWizard.jsx` — e’lon yaratish wizard.
- `pages/Profile.jsx` — profil (demo).

### 🪝 Hooks
- `hooks/useDebouncedValue.js` — debounce.
- `hooks/useMarketAds.js` — paginatsiya + infinite scroll.
- `hooks/useAdDetails.js` — e’lon detal fetch.
- `hooks/useUploadImages.js` — rasm upload wrapper.
- `hooks/useRecentlyViewed.js` — so‘nggi ko‘rilganlar (localStorage).
- `hooks/useComparison.js` — taqqoslash (demo).

### 📡 Services
- `services/marketApi.js` — API wrapper:
  - `api.post("/api/market", { action: "list" | "details" | "create" ... })` ishlaydi.
  - Backend bo‘lmasa: localStorage mock ishlaydi.

## Integratsiya
1) `MarketEntry.jsx` ni routing’ga ulang.  
2) `apiHelper` borligiga ishonch hosil qiling (`src/apiHelper.js`).

## Eslatma
Bu modul **syntax xatosiz** ishlashi uchun minimal, lekin kengaytiriladigan tarzda yozilgan. Backend tayyor bo‘lganda `services/marketApi.js` ichidagi endpoint/action’larni moslab qo‘ysangiz yetadi.
