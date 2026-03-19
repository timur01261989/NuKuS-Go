# API Contract

## Canonical API rules
- All API routes are served under `/api/*`.
- Unknown routes must return `404` with JSON body containing `{ ok: false, error, path }`.
- JSON requests use `application/json`.
- Form requests may use `application/x-www-form-urlencoded`.
- Route resolution is centralized in `api/routeRegistry.js`.

## Critical canonical routes
- `/api/auth`
- `/api/order`
- `/api/order_status`
- `/api/driver`
- `/api/wallet`
- `/api/payments`
- `/api/delivery`
- `/api/freight`
- `/api/intercity`
- `/api/analytics`
- `/api/auto-market`
- `/api/push/register`
- `/api/push/send`
- `/api/event-stream`
- `/api/observability`

## Compatibility aliases
The following aliases are intentionally preserved:
- `order-status` -> `order_status`
- `dispatch-enqueue` <-> `dispatch_enqueue`
- `dispatch-predictions` <-> `dispatch_predictions`
- `dispatch-architecture` <-> `dispatch_architecture`
- `city-dispatch` <-> `city_dispatch`
- `event-stream` <-> `event_stream`
- `push/register` <-> `push_register`
- `push/send` <-> `push_send`
- `driver-heartbeat` <-> `driver_heartbeat`
- `dispatch-match` <-> `dispatch_match`

## Sub-route rule
Some handlers own sub-routes:
- `auto-market/*`
- `push/*` where explicitly mapped
- a route may resolve by root segment when the registry contains the root key

## Body parsing rule
- Empty body => `undefined`
- JSON body => parsed object, otherwise `undefined` on parse failure
- URL encoded body => plain object
- other content types => raw buffer
