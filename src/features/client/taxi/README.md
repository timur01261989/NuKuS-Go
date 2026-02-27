# Taxi module (Yandex-like)

## Folder
Put `taxi/` under your `src/` (recommended: `src/features/taxi/` or `src/pages/taxi/`).

## Entry
Use `taxi/ClientTaxiPage.jsx` as main component (route: /client/taxi).

## Dependencies
- react, antd, @ant-design/icons
- react-leaflet, leaflet
- apiHelper at `@/utils/apiHelper` (already used)

## Notes
This refactor keeps original logic from `ClientTaxiYandex.jsx` and only extracted:
- Map UI => `TaxiMap.jsx`
- Search drawer => `TaxiSearchSheet.jsx`
- Destination picker mini sheet => `DestinationPicker.jsx`
- Locate button => `components/LocateButton.jsx`
- Vehicle marker => `components/VehicleMarker.jsx`

Other files are scaffolding for next features (waypoints, entrance, share, privacy call, hooks).
