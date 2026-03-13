export function makeChunkPrefetcher(loader) {
  let started = false;

  return () => {
    if (started) return;
    started = true;

    try {
      loader();
    } catch {
      // noop
    }
  };
}

export const prefetch = {
  taxi: makeChunkPrefetcher(() => import("../../modules/client/features/client/taxi/ClientTaxiPage.jsx")),
  freight: makeChunkPrefetcher(() => import("../../modules/client/features/client/freight/ClientFreightPage.jsx")),
  intercity: makeChunkPrefetcher(() => import("../../modules/client/features/client/intercity/ClientIntercityPage.jsx")),
  interDistrict: makeChunkPrefetcher(() => import("../../modules/client/features/client/interDistrict/ClientInterDistrictPage.jsx")),
  delivery: makeChunkPrefetcher(() => import("../../modules/client/features/client/delivery/DeliveryPage.jsx")),
};

export default prefetch;
