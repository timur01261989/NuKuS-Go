# PERFORMANCE_APPLY (instant screens like Yandex)

This repo got new additions:
- QueryProvider (react-query cache-first)
- Prefetch helpers (load next service code before click)
- MapSingletonLayout (keep map mounted across service pages)

## 1) Install deps
Add to package.json dependencies:
- @tanstack/react-query

## 2) Wrap app with QueryProvider
In src/main.jsx (or wherever ReactDOM.createRoot is):
Wrap <App /> with <QueryProvider>.

## 3) Prefetch on service buttons
Where you render service cards/buttons, add:
onTouchStart={prefetch.taxi} / onMouseEnter={prefetch.taxi}

## 4) Map singleton routing
If you use react-router-dom:
Set parent route element to MapSingletonLayout and nest service routes.

This avoids map re-mounting and heavy tile reload on every service switch.
