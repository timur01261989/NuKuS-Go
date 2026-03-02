# APPLY_TO_MAPVIEW.md

Open: src/features/map/components/MapView.jsx

1) Add imports at top:
```js
import MapRightControls from "../controls/MapRightControls.jsx";
import TrafficLayer from "../layers/TrafficLayer.jsx";
import ParkingLayer from "../layers/ParkingLayer.jsx";
```

2) Add state inside MapView():
```js
const [showTraffic, setShowTraffic] = useState(false);
const [showParking, setShowParking] = useState(false);
```

3) In <MapContainer> add the layers + controls:
```jsx
<TileLayer ... />

<TrafficLayer enabled={showTraffic} />
<ParkingLayer enabled={showParking} />

<MapRightControls
  onToggleTraffic={() => setShowTraffic(v => !v)}
  onToggleParking={() => setShowParking(v => !v)}
  trafficOn={showTraffic}
  parkingOn={showParking}
  userLoc={userLoc}
/>
```

4) Notes:
- Traffic needs a tile URL provider. Set VITE_TRAFFIC_TILE_URL.
- Parking uses Overpass and may be slow; it caches per viewport.