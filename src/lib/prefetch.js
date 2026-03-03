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
  taxi: makeChunkPrefetcher(() => import("../features/client/taxi/ClientTaxiPage.jsx")),
  freight: makeChunkPrefetcher(() => import("../features/client/freight/ClientFreightPage.jsx")),
  intercity: makeChunkPrefetcher(() => import("../features/client/intercity/ClientIntercityPage.jsx")),
  interDistrict: makeChunkPrefetcher(() => import("../features/client/interDistrict/ClientInterDistrictPage.jsx")),
  delivery: makeChunkPrefetcher(() => import("../features/client/delivery/DeliveryPage.jsx")),
};
