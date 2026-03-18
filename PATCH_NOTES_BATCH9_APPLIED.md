# PATCH_NOTES_BATCH9_APPLIED

Batch 9 continues from Batch 8 and focuses on splitting remaining large pages/services without changing behavior.

## Applied refactors
- Split `src/modules/driver/legacy/freight/FreightPage.jsx`
  - extracted map helpers, body type constants and location picker modal into:
    - `src/modules/driver/legacy/freight/FreightPage.helpers.jsx`
- Split `src/modules/driver/legacy/inter-provincial/InterProvincialPage.jsx`
  - extracted region/address/storage/map/trip-row helpers into:
    - `src/modules/driver/legacy/inter-provincial/InterProvincialPage.helpers.jsx`
- Split `src/modules/client/features/auth/pages/Register.jsx`
  - extracted register input helpers into:
    - `src/modules/client/features/auth/pages/register.helpers.js`
- Split `src/modules/shared/utils/apiHelper.js`
  - extracted shared utility/core helpers into:
    - `src/modules/shared/utils/apiHelper.core.js`
- Added structural regression test:
  - `tests/batch9-structure.test.js`

## Notes
- Import/export compatibility was preserved.
- No legacy files were removed.
- Runtime behavior is intended to remain unchanged.
