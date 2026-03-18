# PATCH_NOTES_BATCH12_APPLIED

Batch 12 focuses on remaining auth/service/client-heavy files without changing the app behavior.

## Added helper files
- src/services/supabase/authService.helpers.js
- src/services/referralLinkService.helpers.js
- src/modules/client/features/auto-market/services/marketApi.helpers.js
- src/modules/client/features/client/freight/ClientFreightPage.helpers.jsx
- tests/batch12-structure.test.js

## Updated files
- src/services/supabase/authService.js
- src/services/referralLinkService.js
- src/modules/client/features/auto-market/services/marketApi.js
- src/modules/client/features/client/freight/ClientFreightPage.jsx

## Summary
- Extracted auth/profile lookup helpers from authService.
- Extracted referral window/storage/url helpers from referralLinkService.
- Extracted localStorage/random/date helpers from marketApi.
- Extracted freight status tag rendering helper from ClientFreightPage.
- Added regression test for the new structure.
