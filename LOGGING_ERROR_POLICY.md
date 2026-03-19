# LOGGING / ERROR POLICY

## Client logging
Use shared logger:
- `clientLogger.info(event, meta)`
- `clientLogger.warn(event, meta)`
- `clientLogger.error(event, meta)`

## User-facing errors
Use shared adapter:
- `getErrorMessage(error, fallback)`
- `toUserError(error, fallback)`

## Rules
- Do not expose secrets/tokens in logs.
- Prefer structured metadata over raw string concatenation.
- UI should show localized/friendly messages instead of raw backend payloads when possible.
