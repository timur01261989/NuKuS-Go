// safeLazy.js
import React from "react";

/**
 * safeLazy(importFn, name)
 * Wraps React.lazy to provide clearer error messages when a chunk fails to load.
 */
export default function safeLazy(importFn, name = "Component") {
  return React.lazy(() =>
    importFn().catch((err) => {
      // Throw a new Error with context so ErrorBoundary shows a helpful message
      throw new Error(`${name} failed to load: ${err?.message || String(err)}`);
    })
  );
}
