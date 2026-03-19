# Batch 19 Applied

This batch continues phase 2 of the remaining cleanup/refactor work.

## Focus
- Thin out client page orchestration layers
- Move state/effects/controller logic out of heavy pages
- Keep behavior unchanged
- Preserve imports/exports and legacy compatibility

## Applied changes

### 1. Auth session resolver split
- Added `src/services/supabase/authService.resolver.js`
- `resolveAuthSession()` now delegates to a resolver module
- `authService.js` remains the public entry point

### 2. MyAddresses page split
- Added `myAddresses.logic.js`
- Added `myAddresses.sections.jsx`
- `MyAddresses.jsx` now focuses on composition

### 3. Dashboard page split
- Added `dashboard.logic.js`
- Added `dashboard.sections.jsx`
- `Dashboard.jsx` now uses a controller + presentational sections
- Fixed header language icon import through extracted header component

### 4. MainPage split
- Added `useMainPageController.js`
- `MainPage.jsx` now delegates state/effects/routing setup to a controller hook

### 5. Regression coverage
- Added `tests/batch19-structure.test.js`
