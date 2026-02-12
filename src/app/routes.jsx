// Central routes registry (gradual migration).
// NOTE: App.jsx still owns the real routing; this file exists for future refactors.
// We keep it exported + imported to avoid dead code drift.

export const routes = [
  { path: "/__dev", label: "DevHub (hidden)", hidden: true },
];
