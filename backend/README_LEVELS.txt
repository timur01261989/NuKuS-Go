LEVEL 1 (Must)
- public/sw.js: tile cache + offline tile fallback
- src/services/routingAdapter.js: ORS(test) / Valhalla(prod)
- src/services/navigatorEngine.js: off-route + reroute + maneuvers
- Icon system: public/icons/nav/* + src/shared/utils/iconRegistry.js

LEVEL 2 (Pro)
- Font fallback: src/shared/styles/fonts.css (imported in main.jsx)

LEVEL 3 (Super Pro)
- Telemetry: src/services/telemetryService.js (local analytics + ETA heuristic)
- Road quality avoid helper: src/shared/utils/routingOptions.js
- Hook: src/shared/hooks/useNavigator.js

TEST (ORS)
- .env:
  VITE_ROUTING_PROVIDER=ors
  VITE_ORS_API_KEY=YOUR_KEY
