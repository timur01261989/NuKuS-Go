# PATCH NOTES — Batch 7 Applied

Batch 7 focuses on **safe structural refactors** for the heaviest frontend files without changing product behavior.

## Main goals
- split semiz files into smaller helper/component modules
- keep imports/exports working
- preserve existing runtime behavior and routing
- avoid deleting legacy files

## Applied changes

### 1) ClientOrderCreate decomposition
Created:
- `src/modules/client/features/client/components/clientOrderCreate.helpers.js`

Updated:
- `src/modules/client/features/client/components/ClientOrderCreate.jsx`

Moved out:
- leaflet pin/icon definitions
- map helper components
- tariff constants
- small formatting / geo helper utilities

### 2) ClientTaxiPage decomposition
Created:
- `src/modules/client/features/client/taxi/taxiMapArtifacts.jsx`

Updated:
- `src/modules/client/features/client/taxi/ClientTaxiPage.impl.jsx`

Moved out:
- pickup/destination icon definitions
- map watcher helper
- locate button component

### 3) DriverSettingsPage decomposition
Created:
- `src/modules/driver/legacy/pages/driverSettings.helpers.js`
- `src/modules/driver/legacy/pages/driverSettings.sections.jsx`

Updated:
- `src/modules/driver/legacy/pages/DriverSettingsPage.jsx`

Moved out:
- data normalization helpers
- supabase safe-select helpers
- service type helpers
- request modal
- service editor
- vehicle card section

### 4) Regression coverage
Created:
- `tests/batch7-structure.test.js`

Covers:
- extracted helper modules exist
- main files import new helper modules
- major exported pieces remain present

## Notes
- behavior intentionally preserved
- no legacy file was deleted
- this batch is a maintainability/stability refactor batch
