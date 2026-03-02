# APPLY_ADVANCED_MAP.md

## Env
Set in .env:
VITE_OSRM_BASE_URL=https://your-osrm-host
VITE_OSRM_PROFILE=driving

## 1) Snap-to-road for driver marker
- Use `snapToRoadOSRM()` from `src/providers/route/osrmMatch.js`
- When you receive driver GPS, optionally snap it before rendering.

## 2) Smoothing
- Wrap incoming driver location stream with:
  `const smooth = useDriverSmoother();`
  `const p = smooth(rawPoint);`

## 3) Follow mode (camera logic)
Inside your map component (MapContainer present):
- `useFollowMode({ enabled, center, zoom })`
Toggle enabled during:
- waiting/approaching/in_trip -> true
- browsing/selecting -> false

## 4) Route progress
Replace RouteLine with:
<RouteProgressLine points={routePoints} progressIndex={progressIndex} />
Where progressIndex is nearest point index to current position.
Use helper: nearestPointIndex()

## 5) Auto reroute
Use `useAutoReroute({ enabled, pickup, dropoff, current, onRoute })`
It will refresh the route if the driver deviates from polyline by a threshold.

NOTE:
- These are foundations. You'll tune thresholds for your city.