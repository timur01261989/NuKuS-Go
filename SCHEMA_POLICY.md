# SCHEMA POLICY

## Source of truth
Schema changes must be introduced through:
- `supabase/migrations/*`

## Non-source directories
These must not be treated as canonical schema definitions:
- `sql/*` (manual queries, reporting, diagnostics)
- inline SQL snippets inside docs
- Edge Function assumptions

## Change workflow
1. Add migration
2. Review migration impact on Edge Functions and server handlers
3. Update docs/examples only after migration exists
4. Avoid editing historical SQL helpers as if they were schema source of truth

## Goal
Prevent schema drift between migrations, manual SQL snippets, and runtime expectations.
