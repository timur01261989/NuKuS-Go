# ROUTING RULES

## Canonical route source
Use `src/app/router/routePaths.js` as the source of truth for route paths.

## Canonical policy
- Client home: `/`
- Driver home: `/driver`
- Driver pending: `/driver/pending`
- Driver register: `/driver/register`
- Login: `/login`
- Register: `/register`

## Compatibility policy
Legacy routes may continue to redirect for backward compatibility:
- `/driver/dashboard` -> `/driver`
- `/client/home` -> `/`

Do not add new features against compatibility-only routes.

## Guard policy
- Use `AuthGuard` for authenticated client areas.
- Use `DriverGuard` for driver-only areas.
- Use `selectAccessState(auth)` for route decisions and redirects.
