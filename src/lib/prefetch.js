/**
 * Prefetch helpers:
 * - Prefetch route code (dynamic imports)
 * - Prefetch common queries (tariffs/services/profile) if you wire them to react-query
 *
 * This is pure helper; safe to import anywhere.
 */
export function makeChunkPrefetcher(loader) {
  let started = false;
  return () => {
    if (started) return;
    started = true;
    try { loader(); } catch (_) {}
  };
}

/**
 * Attach to service buttons:
 *  onTouchStart={prefetchTaxi}
 *  onMouseEnter={prefetchTaxi}
 */
export const prefetch = {
  taxi: makeChunkPrefetcher(() => import("../pages/client/taxi/TaxiPage.jsx")),
  freight: makeChunkPrefetcher(() => import("../pages/client/freight/FreightPage.jsx")),
  intercity: makeChunkPrefetcher(() => import("../pages/client/inter-provincial/InterProvincialPage.jsx")),
  delivery: makeChunkPrefetcher(() => import("../pages/client/delivery/DeliveryPage.jsx")),
};
