# LEGACY DRIVER LAYER NOTE

## Status
- This layer is still active for compatibility and current driver UX.
- New features should prefer newer shared/auth/routing patterns instead of adding more cross-cutting logic here.

## Rules
- Allowed: bugfixes, compatibility fixes, safe refactors, extraction into helpers/controllers/sections.
- Avoid: introducing new business rules directly inside large page components.
- Prefer: selectors, controllers, sections, and shared route/access helpers.

## Goal
Keep current behavior stable while reducing business-UI coupling over time.
