# Batch 2 Applied

## Focus
Auth + routing stabilization without changing product behavior.

## Added
- `src/app/router/routePaths.js`
- `src/modules/shared/auth/accessState.js`

## Updated
- `src/App.jsx`
- `src/modules/shared/auth/useSessionProfile.js`
- `src/app/guards/AuthGuard.jsx`
- `src/app/guards/DriverGuard.jsx`
- `src/app/router/AppRouter.jsx`
- `src/app/router/ClientRoutes.jsx`
- `src/app/router/DriverRoutes.jsx`
- `src/modules/shared/shared/routes/RoleGate.jsx`
- `src/modules/shared/shared/routes/RedirectByRole.jsx`
- `src/modules/shared/shared/routes/DriverModeRedirect.jsx`
- `src/modules/client/pages/pages/RootRedirect.jsx`

## What changed
1. Added canonical route constants.
2. Unified auth/access decisions behind a single selector.
3. Removed duplicated session orchestration from `useSessionProfile`.
4. Replaced timer-based driver guard behavior with deterministic access-state routing.
5. Removed RootRedirect side-effect that tried to mutate profile role during navigation.
6. Preserved old route compatibility through redirects.
