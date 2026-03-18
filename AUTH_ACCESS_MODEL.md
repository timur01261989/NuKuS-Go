# AUTH ACCESS MODEL

Canonical access modes used by `src/modules/shared/auth/accessState.js`.

## Modes
- `loading`: auth/session is still resolving
- `guest`: no authenticated user
- `client`: authenticated client user
- `driver_unregistered`: authenticated user without approved driver profile/application
- `driver_pending`: driver application exists but is pending/review
- `driver_rejected`: driver application exists but is rejected/declined/cancelled
- `driver_approved`: approved or active driver
- `admin`: authenticated admin role

## Canonical targets
- guest -> `/login`
- client -> `/`
- driver_unregistered -> `/driver/register`
- driver_pending -> `/driver/pending`
- driver_rejected -> `/driver/register`
- driver_approved -> `/driver`
- admin -> `/`

## Rules
- New route decisions must use `selectAccessState(auth)`.
- New pages should not re-implement role logic inline.
- Compatibility redirects may exist, but canonical targets come from `routePaths.js`.
