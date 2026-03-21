# CLIENT PAGES NOTE

## Status
Some pages here are legacy or compatibility-oriented shells around newer feature modules.

## Rules
- Prefer extracting logic into `*.logic.js`, `*.selectors.js`, or `*.sections.jsx`.
- Avoid adding new business rules directly into large page files.
- Keep canonical routing and shared auth/access helpers as the source of truth.
