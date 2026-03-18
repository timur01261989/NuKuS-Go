# Batch 13 Applied

## Goal
Maximally split the heaviest remaining client/auth pages without changing behavior or shrinking features.

## Changed areas
- `src/modules/client/pages/pages/MainPage.jsx`
- `src/modules/client/pages/pages/mainPage.sections.jsx`
- `src/modules/driver/legacy/DriverRegistration/DriverRegister.jsx`
- `src/modules/driver/legacy/DriverRegistration/driverRegister.helpers.jsx`
- `src/modules/client/features/client/taxi/hooks/useTaxiOrder.core.js`
- `src/modules/client/features/client/taxi/hooks/useTaxiOrder.core.helpers.js`
- `src/modules/client/features/client/components/ClientOrderCreate.jsx`
- `src/modules/client/features/client/components/clientOrderCreate.sections.jsx`
- `tests/batch13-structure.test.js`

## Summary
- MainPage side menu / top card / bottom sheet extracted.
- DriverRegister theme, styles, header alert, and layout extracted.
- Taxi core hook moved constants + debounced reverse hook + tariff factory to helper module.
- ClientOrderCreate moved accepted/details/chat/rating UI and full style sheet to a section module.
- Structure regression test added.

## Notes
- Behavior preserved.
- No legacy files deleted.
- Import/export compatibility maintained.
